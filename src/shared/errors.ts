// PRD v5 Section 28 - Error Handling Requirements

export class StegoCodecError extends Error {
  public userMessage: string;
  constructor(message: string, userMessage: string) {
    super(message);
    this.name = 'StegoCodecError';
    this.userMessage = userMessage;
  }
}

export class FileTooLargeError extends StegoCodecError {
  constructor(message: string = "File is too large for browser-based processing.") {
    super(message, message);
    this.name = 'FileTooLargeError';
  }
}

export class UnsupportedImageFormatError extends StegoCodecError {
  constructor(message: string = "Unsupported image format. Please upload PNG, JPEG, or WebP.") {
    super(message, message);
    this.name = 'UnsupportedImageFormatError';
  }
}

export class UnsupportedAudioFormatError extends StegoCodecError {
  constructor(message: string = "Unsupported audio format. Please upload a WAV/PCM file.") {
    super(message, message);
    this.name = 'UnsupportedAudioFormatError';
  }
}

export class UnsupportedVideoFormatError extends StegoCodecError {
  constructor(message: string = "Unsupported video format or browser decoder not available.") {
    super(message, message);
    this.name = 'UnsupportedVideoFormatError';
  }
}

export class PayloadTooLargeError extends StegoCodecError {
  constructor(message: string = "Payload is too large for the selected media and ECC configuration.") {
    super(message, message);
    this.name = 'PayloadTooLargeError';
  }
}

export class CrcInvalidError extends StegoCodecError {
  constructor(message: string = "Extracted message failed CRC validation.") {
    super(message, message);
    this.name = 'CrcInvalidError';
  }
}

export class HeaderParseFailedError extends StegoCodecError {
  constructor(message: string = "Could not read payload header. Extraction failed.") {
    super(message, message);
    this.name = 'HeaderParseFailedError';
  }
}

export class EccDecodeFailedError extends StegoCodecError {
  constructor(message: string = "ECC decoding failed.") {
    super(message, message);
    this.name = 'EccDecodeFailedError';
  }
}

export class WebCodecsUnavailableError extends StegoCodecError {
  constructor(message: string = "Browser does not support video processing. Use latest Chrome or Edge.") {
    super(message, message);
    this.name = 'WebCodecsUnavailableError';
  }
}

export class WebWorkerUnavailableError extends StegoCodecError {
  constructor(message: string = "Browser does not support required background processing.") {
    super(message, message);
    this.name = 'WebWorkerUnavailableError';
  }
}

export class ExportFailedError extends StegoCodecError {
  constructor(message: string = "Failed to export result. Please try again.") {
    super(message, message);
    this.name = 'ExportFailedError';
  }
}

export class ShareLinkExpiredError extends StegoCodecError {
  constructor(message: string = "This share link has expired.") {
    super(message, message);
    this.name = 'ShareLinkExpiredError';
  }
}

export class MetricsStorageFailedError extends StegoCodecError {
  constructor(message: string = "Experiment completed, but local history could not be saved.") {
    super(message, message);
    this.name = 'MetricsStorageFailedError';
  }
}
