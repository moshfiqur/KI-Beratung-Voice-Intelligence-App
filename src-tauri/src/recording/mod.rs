use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use hound::{WavSpec, WavWriter};
use parking_lot::Mutex;
use once_cell::sync::OnceCell;
use std::path::PathBuf;
use std::sync::mpsc;
use std::thread;
use std::time::{SystemTime, UNIX_EPOCH};

pub struct RecordingState {
    pub is_recording: bool,
    pub stream: Option<cpal::Stream>,
    pub start_time: Option<u64>,
    pub file_path: Option<PathBuf>,
}

pub static RECORDING_STATE: OnceCell<Mutex<RecordingState>> = OnceCell::new();

pub fn get_state() -> &'static Mutex<RecordingState> {
    RECORDING_STATE.get_or_init(|| Mutex::new(RecordingState {
        is_recording: false,
        stream: None,
        start_time: None,
        file_path: None,
    }))
}

pub fn list_audio_devices() -> Result<Vec<String>, String> {
    let host = cpal::default_host();
    let devices = host.input_devices().map_err(|e| e.to_string())?;
    let mut names = Vec::new();
    for device in devices {
        if let Ok(desc) = device.description() {
            names.push(desc.to_string());
        }
    }
    Ok(names)
}

pub fn start_recording(device_name: Option<String>) -> Result<u64, String> {
    let mut state = get_state().lock();
    if state.is_recording {
        return Err("Already recording".to_string());
    }

    let host = cpal::default_host();
    let device = if let Some(name) = device_name {
        host.input_devices()
            .map_err(|e| e.to_string())?
            .find(|x| {
                x.description()
                    .map(|desc| desc.to_string() == name)
                    .unwrap_or(false)
            })
            .ok_or_else(|| format!("Device not found: {}", name))?
    } else {
        host.default_input_device()
            .ok_or_else(|| "No default input device found".to_string())?
    };

    let config = device
        .default_input_config()
        .map_err(|e| e.to_string())?;

    let sample_rate = config.sample_rate().into();
    let channels = config.channels();
    let sample_format = config.sample_format();

    println!("Recording with sample rate: {}, channels: {}, format: {:?}", sample_rate, channels, sample_format);

    // Prepare WAV spec
    let spec = WavSpec {
        channels: 1, // We want mono
        sample_rate: sample_rate,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };

    // Create a temp file path
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();

    let file_path = std::env::temp_dir().join(format!("recording_{}.wav", now));
    let file_path_clone = file_path.clone();

    let (tx, rx) = mpsc::channel::<f32>();

    // Spawn a thread for writing to WAV
    thread::spawn(move || {
        let mut writer = WavWriter::create(file_path_clone, spec).expect("Failed to create WavWriter");
        while let Ok(sample) = rx.recv() {
            // Convert f32 to i16
            let sample_i16 = (sample * i16::MAX as f32) as i16;
            let _ = writer.write_sample(sample_i16);
        }
        let _ = writer.finalize();
        println!("WAV file finalized");
    });

    let err_fn = |err| eprintln!("an error occurred on stream: {}", err);

    let stream = match sample_format {
        cpal::SampleFormat::F32 => {
            device.build_input_stream(
                &config.into(),
                move |data: &[f32], _: &cpal::InputCallbackInfo| {
                    for frame in data.chunks(channels as usize) {
                        // Take the first channel for mono
                        let _ = tx.send(frame[0]);
                    }
                },
                err_fn,
                None
            )
        }
        cpal::SampleFormat::I16 => {
            device.build_input_stream(
                &config.into(),
                move |data: &[i16], _: &cpal::InputCallbackInfo| {
                    for frame in data.chunks(channels as usize) {
                        let _ = tx.send(frame[0] as f32 / i16::MAX as f32);
                    }
                },
                err_fn,
                None
            )
        }
        _ => return Err(format!("Unsupported sample format: {:?}", sample_format)),
    }.map_err(|e| e.to_string())?;

    stream.play().map_err(|e| e.to_string())?;

    state.is_recording = true;
    state.stream = Some(stream);
    state.start_time = Some(now as u64);
    state.file_path = Some(file_path);

    Ok(now as u64)
}

pub fn stop_recording() -> Result<(PathBuf, u64), String> {
    let mut state = get_state().lock();
    if !state.is_recording {
        return Err("Not recording".to_string());
    }

    // Dropping the stream stops the recording
    state.stream.take();
    state.is_recording = false;

    let path = state.file_path.take().ok_or("No file path found")?;
    let start_time = state.start_time.take().ok_or("No start time found")?;
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64;

    let duration = now.saturating_sub(start_time);

    Ok((path, duration))
}
