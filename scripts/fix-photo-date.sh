#!/usr/bin/env bash
#
# fix-photo-date.sh - set or shift the capture timestamp of iPhone photos/videos.
#
# Updates the EXIF dates in JPEG/HEIC images (DateTimeOriginal, CreateDate,
# ModifyDate, OffsetTime*) and the QuickTime/Keys dates in MOV/MP4 files
# (Live Photo videos, recordings), plus the file's modification time, so
# Apple Photos, Google Photos, Lightroom, etc. sort them correctly.
#
# Requires exiftool:
#   macOS:          brew install exiftool
#   Debian/Ubuntu:  sudo apt install libimage-exiftool-perl
#
# Usage:
#   fix-photo-date.sh [options] FILE_OR_DIR...
#
# Options:
#   -d, --date "YYYY:MM:DD HH:MM:SS"  Set an absolute date/time (local time).
#   -s, --shift "[+|-][Y:M:D ]H:M:S"  Shift existing dates, e.g. "+1:00:00"
#                                     (1 hour later) or "-0:0:1 0:0:0" (1 day
#                                     earlier).
#   -z, --tz "+HH:MM"                 Time zone where the photo was taken, e.g.
#                                     "+02:00" or "-05:00". Written to
#                                     OffsetTime* and used to convert video
#                                     dates (stored in UTC). Defaults to this
#                                     computer's time zone for videos.
#   -n, --dry-run                     Show current dates, change nothing.
#       --no-backup                   Don't keep FILE_original backup copies.
#   -h, --help                        Show this help.
#
# Examples:
#   fix-photo-date.sh -d "2024:07:14 18:30:00" -z "+02:00" IMG_1234.HEIC IMG_1234.MOV
#   fix-photo-date.sh -s "+9:00:00" ~/Pictures/Japan-trip/
#   fix-photo-date.sh -n IMG_1234.HEIC
#
set -euo pipefail

usage() { sed -n '2,/^set -euo/{/^set -euo/d;s/^# \{0,1\}//;p}' "$0"; exit "${1:-0}"; }
die()   { echo "error: $*" >&2; exit 1; }

date_val="" shift_val="" tz="" dry_run=0 backup=1
files=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -d|--date)   date_val="${2:?missing value for $1}"; shift 2 ;;
    -s|--shift)  shift_val="${2:?missing value for $1}"; shift 2 ;;
    -z|--tz)     tz="${2:?missing value for $1}"; shift 2 ;;
    -n|--dry-run) dry_run=1; shift ;;
    --no-backup) backup=0; shift ;;
    -h|--help)   usage 0 ;;
    --)          shift; files+=("$@"); break ;;
    -*)          die "unknown option: $1 (see --help)" ;;
    *)           files+=("$1"); shift ;;
  esac
done

command -v exiftool >/dev/null || die "exiftool not found (brew install exiftool / apt install libimage-exiftool-perl)"
[[ ${#files[@]} -gt 0 ]] || usage 1

for f in "${files[@]}"; do [[ -e "$f" ]] || die "no such file or directory: $f"; done

# Image and video tags iPhones write. Dates on one line, so we can loop.
image_tags=(EXIF:DateTimeOriginal EXIF:CreateDate EXIF:ModifyDate)
video_tags=(QuickTime:CreateDate QuickTime:ModifyDate
            QuickTime:TrackCreateDate QuickTime:TrackModifyDate
            QuickTime:MediaCreateDate QuickTime:MediaModifyDate
            Keys:CreationDate)
offset_tags=(EXIF:OffsetTime EXIF:OffsetTimeOriginal EXIF:OffsetTimeDigitized)
ext_args=(-ext jpg -ext jpeg -ext heic -ext heif -ext png -ext dng
          -ext mov -ext mp4 -ext m4v)

show() {
  exiftool -r "${ext_args[@]}" -api QuickTimeUTC -G1 -s \
    -DateTimeOriginal -CreateDate -Keys:CreationDate -OffsetTimeOriginal \
    -FileModifyDate "$@"
}

if [[ $dry_run -eq 1 ]]; then
  show "${files[@]}"
  exit 0
fi

[[ -n "$date_val" || -n "$shift_val" ]] || die "specify --date or --shift (or --dry-run to inspect)"
[[ -z "$date_val" || -z "$shift_val" ]] || die "use either --date or --shift, not both"
if [[ -n "$date_val" ]] && ! [[ "$date_val" =~ ^[0-9]{4}:[0-9]{2}:[0-9]{2}\ [0-9]{2}:[0-9]{2}(:[0-9]{2})?$ ]]; then
  die "--date must look like \"YYYY:MM:DD HH:MM:SS\""
fi
if [[ -n "$tz" ]] && ! [[ "$tz" =~ ^[+-][0-9]{2}:[0-9]{2}$ ]]; then
  die "--tz must look like \"+HH:MM\" or \"-HH:MM\""
fi

args=(-r "${ext_args[@]}" -api QuickTimeUTC -P)
[[ $backup -eq 0 ]] && args+=(-overwrite_original)

if [[ -n "$date_val" ]]; then
  for t in "${image_tags[@]}"; do args+=("-$t=$date_val"); done
  # Video dates are stored in UTC; giving the zone lets exiftool convert.
  for t in "${video_tags[@]}"; do args+=("-$t=$date_val$tz"); done
  args+=("-FileModifyDate=$date_val$tz")
else
  op="+="
  case "$shift_val" in
    -*) op="-="; shift_val="${shift_val#-}" ;;
    +*) shift_val="${shift_val#+}" ;;
  esac
  for t in "${image_tags[@]}" "${video_tags[@]}" FileModifyDate; do
    args+=("-$t$op$shift_val")
  done
fi

if [[ -n "$tz" ]]; then
  for t in "${offset_tags[@]}"; do args+=("-$t=$tz"); done
fi

exiftool "${args[@]}" "${files[@]}"
echo
echo "New dates:"
show "${files[@]}"
[[ $backup -eq 1 ]] && echo && echo "Backups saved as *_original (delete them once you're happy)."
exit 0
