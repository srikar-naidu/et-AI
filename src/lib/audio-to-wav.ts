/** Convert browser/media audio (e.g. WebM) to PCM WAV for Aurigin. */

const TARGET_SAMPLE_RATE = 16000;
const MIN_DURATION_SECONDS = 3;

export class AudioPrepError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AudioPrepError";
  }
}

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function mixToMono(buffer: AudioBuffer): Float32Array {
  const frames = buffer.length;
  const mono = new Float32Array(frames);
  if (buffer.numberOfChannels === 1) {
    mono.set(buffer.getChannelData(0));
    return mono;
  }

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < frames; i += 1) {
      mono[i] += data[i] / buffer.numberOfChannels;
    }
  }
  return mono;
}

function resampleLinear(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i += 1) {
    const position = i * ratio;
    const left = Math.floor(position);
    const right = Math.min(left + 1, input.length - 1);
    const frac = position - left;
    output[i] = input[left] * (1 - frac) + input[right] * frac;
  }
  return output;
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const clipped = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(offset, clipped < 0 ? clipped * 0x8000 : clipped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

/**
 * Decode any browser-playable audio blob and return a mono 16 kHz PCM WAV File.
 * Aurigin accepts WAV/MP3/M4A/FLAC/OGG, but not WebM from MediaRecorder.
 */
export async function prepareAudioForAurigin(input: Blob, fileName = "voice-sample.wav"): Promise<File> {
  const arrayBuffer = await input.arrayBuffer();
  if (!arrayBuffer.byteLength) {
    throw new AudioPrepError("The audio file is empty.");
  }

  const audioCtx = new AudioContext();
  try {
    const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    const duration = decoded.duration;
    if (!Number.isFinite(duration) || duration < MIN_DURATION_SECONDS) {
      throw new AudioPrepError(
        `Clip is too short (${duration ? duration.toFixed(1) : "0"}s). Record or upload at least ${MIN_DURATION_SECONDS} seconds of clear speech.`,
      );
    }

    const mono = mixToMono(decoded);
    const resampled = resampleLinear(mono, decoded.sampleRate, TARGET_SAMPLE_RATE);
    const wavBlob = encodeWav(resampled, TARGET_SAMPLE_RATE);
    const baseName = fileName.replace(/\.[^.]+$/, "") || "voice-sample";
    return new File([wavBlob], `${baseName}.wav`, { type: "audio/wav" });
  } catch (error) {
    if (error instanceof AudioPrepError) throw error;
    throw new AudioPrepError(
      "Could not decode this audio for authenticity screening. Try exporting as WAV or MP3.",
    );
  } finally {
    await audioCtx.close().catch(() => undefined);
  }
}
