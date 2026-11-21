"""Build the site's interface sounds from two CC0 field recordings.

Produces dist/assets/audio/{soft-sweep,soft-return,soft-key}.wav: band-pass
filtering and a slight pitch drop (ffmpeg), silence trimming, peak
normalisation and eased fades (NumPy). The return sweep is the sweep reversed.
Sources and licences are listed in dist/assets/audio/CREDITS.md.

Usage:  python tools/prepare_audio.py        (needs ffmpeg on PATH and numpy)

After regenerating, update the matching sha256 entries in manifest.json.
"""
from pathlib import Path
import json
import subprocess
import wave

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "audio-source"
OUT = ROOT / "dist" / "assets" / "audio"
RATE = 44100


def decode(name: str, filters: str) -> np.ndarray:
    """Decode an audio file to mono float32 at 44.1 kHz through an ffmpeg filter chain."""
    raw = subprocess.check_output(
        ["ffmpeg", "-v", "error", "-i", str(SRC / name), "-af", filters,
         "-ar", str(RATE), "-ac", "1", "-f", "f32le", "-"]
    )
    return np.frombuffer(raw, dtype=np.float32).copy()


def trim(x: np.ndarray) -> np.ndarray:
    """Drop leading/trailing silence below 2.5 % of peak, keeping short margins."""
    active = np.flatnonzero(np.abs(x) > np.abs(x).max() * 0.025)
    return x[max(0, active[0] - 400): min(len(x), active[-1] + 1800)]


def save(name: str, x: np.ndarray, peak: float, fade_in: float, fade_out: float) -> dict:
    """Normalise to `peak`, apply eased fades and write 16-bit mono PCM."""
    x = x.copy() * (peak / np.abs(x).max())
    n = min(int(fade_in * RATE), len(x) // 3)
    m = min(int(fade_out * RATE), len(x) // 2)
    x[:n] *= np.linspace(0, 1, n) ** 1.5
    x[-m:] *= np.linspace(1, 0, m) ** 1.5
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setparams((1, 2, RATE, 0, "NONE", "not compressed"))
        w.writeframes((x * 32767).astype("<i2").tobytes())
    return {"file": f"{name}.wav", "duration": round(len(x) / RATE, 3), "peak": round(float(np.abs(x).max()), 3)}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    swish = trim(decode("swish.mp3", "highpass=f=130,lowpass=f=2700,asetrate=35280,aresample=44100"))
    key = trim(decode("key.mp3", "highpass=f=90,lowpass=f=1700,asetrate=37485,aresample=44100"))
    key = key[: int(0.24 * RATE)]  # keep a single damped press, not press + release

    stats = [
        save("soft-sweep", swish, 0.70, 0.045, 0.13),
        save("soft-return", swish[::-1], 0.60, 0.035, 0.12),
        save("soft-key", key, 0.60, 0.007, 0.07),
    ]
    print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()
