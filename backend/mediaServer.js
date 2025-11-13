import NodeMediaServer from 'node-media-server';

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000, // Port for HLS streams
    mediaroot: './media',
    allow_origin: '*'
  },
  trans: {
    // You can point this to the FFmpeg path if you install it
    // on your server for other potential uses, but nms has its own logic.
    ffmpeg: '/usr/bin/ffmpeg', 
    tasks: [
      {
        app: 'live',
        hls: true,
        hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
        hlsKeep: false,
      }
    ]
  }
};

const nms = new NodeMediaServer(config);

export default nms;