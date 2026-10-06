# Take apart an AI supercomputer

**Play it:** https://karanchoudharyyt-source.github.io/ai-rack/

An interactive 3D model of an NVIDIA Vera Rubin NVL72 rack that you can pull apart in your browser:

1. **Rack**: 72 Rubin GPUs + 36 Vera CPUs, 1,296 chips, 3,600 PFLOPS NVFP4
2. **Trays**: 18 compute trays + 9 NVLink switch trays
3. **Tray**: two superchips, cold plates, ConnectX-9 SuperNICs, BlueField-4 DPU; no fans, no cables
4. **Superchip**: 1 Vera CPU (88 cores) + 2 Rubin GPUs over 1.8 TB/s NVLink-C2C
5. **GPU**: 2 compute dies, 336 billion transistors, 288 GB HBM4
6. **Token**: follow one piece of data from a GPU through the NVLink spine and a switch tray to another GPU in one hop

Drag to orbit, scroll or pinch to zoom, use the step buttons or arrow keys. It works on phones.

Built by [Droid](https://factory.ai) from a single prompt (see [PROMPT.md](PROMPT.md)). One HTML file, about 800 lines, using Three.js from a CDN. No build step.

## Video

The 33-second video is rendered from the same file. `index.html?demo` exposes `window.renderAt(t)`, and the scripts render it frame by frame:

```sh
npm i puppeteer-core three@0.170.0
python3 -m http.server 8766 &
./render-all.sh                     # 990 frames at 30 fps via headless Chrome
node audio.js post/soundtrack.wav   # synthesized soundtrack
ffmpeg -i post/soundtrack.wav -af loudnorm=I=-15:TP=-1.5 post/master.wav
./encode.sh                         # MP4s in post/
```

The MP4s are in the [v1.0 release](https://github.com/karanchoudharyyt-source/ai-rack/releases/tag/v1.0).

## Sources

All numbers come from NVIDIA's public Vera Rubin NVL72 product page (spec table) and the NVIDIA technical blog post "Inside the Vera Rubin Platform". Where the two differ (memory and NVLink bandwidth), the spec table is used. The 3D model is simplified: it shows the layout, not exact parts.

Fan-made explainer. Not affiliated with or endorsed by NVIDIA.
