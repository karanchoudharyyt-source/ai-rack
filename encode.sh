#!/bin/sh
# Encodes the rendered frames + mastered soundtrack into X-ready MP4s:
#   post/ai-rack.mp4        2 s cold open on the glowing token path, then the full 33 s cut
#   post/ai-rack-plain.mp4  the 33 s cut as rendered
set -e
cd "$(dirname "$0")"
[ "$(ls frames | grep -c '\.jpg$')" -ge 990 ] || { echo "frames incomplete"; exit 1; }
V="-c:v libx264 -preset slow -crf 17 -maxrate 25M -bufsize 50M -profile:v high -level 4.2 -pix_fmt yuv420p -g 60"
A="-c:a aac -b:a 192k -ar 48000"
CO=${CO:-28.6}

ffmpeg -loglevel error -y -framerate 30 -i frames/f%04d.jpg -i post/master.wav \
  -map 0:v -map 1:a $V $A -shortest -movflags +faststart post/ai-rack-plain.mp4

ffmpeg -loglevel error -y -framerate 30 -i frames/f%04d.jpg -i post/master.wav -filter_complex "
  [0:v]split[v0][v1];
  [v0]trim=start=$CO:duration=2,setpts=PTS-STARTPTS[vc];
  [v1]trim=start=0:end=33,setpts=PTS-STARTPTS[vm];
  [vc][vm]concat=n=2:v=1:a=0[v];
  [1:a]asplit[a0][a1];
  [a0]atrim=start=$CO:duration=2.4,asetpts=PTS-STARTPTS,afade=t=in:d=0.05[ac];
  [a1]atrim=start=0:end=33,asetpts=PTS-STARTPTS[am];
  [ac][am]acrossfade=d=0.4:c1=tri:c2=tri[a]" \
  -map '[v]' -map '[a]' $V $A -movflags +faststart post/ai-rack.mp4

for f in post/ai-rack.mp4 post/ai-rack-plain.mp4; do
  printf '%s  ' "$f"
  ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate -of csv=p=0 "$f" | tr '\n' ' '
  echo
done
