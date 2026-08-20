import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';

import '../theme/app_theme.dart';
import '../utils/image_url.dart';

class NetworkImageBox extends StatelessWidget {
  const NetworkImageBox({
    super.key,
    required this.image,
    this.height,
    this.width,
    this.fit = BoxFit.cover,
    this.label = 'Image',
  });
  final String? image;
  final double? height;
  final double? width;
  final BoxFit fit;
  final String label;

  @override
  Widget build(BuildContext context) {
    final isVid = isVideoUrl(image);
    if (isVid && image != null && image!.isNotEmpty) {
      return Semantics(
        image: true,
        label: label,
        child: VideoFrameThumbnail(
          videoUrl: image!,
          height: height,
          width: width,
          fit: fit,
        ),
      );
    }

    final url = resolveImageUrl(image);
    if (url == null) return _fallback();
    return Semantics(
      image: true,
      label: label,
      child: Image.network(
        url,
        height: height,
        width: width,
        fit: fit,
        errorBuilder: (_, __, ___) => _fallback(),
      ),
    );
  }

  Widget _fallback() => SizedBox(
    height: height,
    width: width,
    child: const ColoredBox(
      color: ZeereTheme.aqua,
      child: Center(child: Icon(Icons.image_outlined, color: ZeereTheme.teal)),
    ),
  );
}

class VideoFrameThumbnail extends StatefulWidget {
  const VideoFrameThumbnail({
    super.key,
    required this.videoUrl,
    this.height,
    this.width,
    this.fit = BoxFit.cover,
  });

  final String videoUrl;
  final double? height;
  final double? width;
  final BoxFit fit;

  @override
  State<VideoFrameThumbnail> createState() => _VideoFrameThumbnailState();
}

class _VideoFrameThumbnailState extends State<VideoFrameThumbnail> {
  VideoPlayerController? _controller;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _initVideo();
  }

  @override
  void didUpdateWidget(VideoFrameThumbnail oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.videoUrl != widget.videoUrl) {
      _controller?.dispose();
      _controller = null;
      _isInitialized = false;
      _initVideo();
    }
  }

  Future<void> _initVideo() async {
    final resolved = resolveImageUrl(widget.videoUrl);
    if (resolved == null || resolved.isEmpty) return;
    try {
      final controller = VideoPlayerController.networkUrl(Uri.parse(resolved));
      await controller.initialize();
      await controller.seekTo(const Duration(milliseconds: 200));
      await controller.setVolume(0.0);
      if (mounted) {
        setState(() {
          _controller = controller;
          _isInitialized = true;
        });
      } else {
        await controller.dispose();
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isInitialized = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isInitialized && _controller != null && _controller!.value.isInitialized) {
      return SizedBox(
        width: widget.width,
        height: widget.height,
        child: ClipRect(
          child: FittedBox(
            fit: widget.fit,
            child: SizedBox(
              width: _controller!.value.size.width > 0 ? _controller!.value.size.width : 100,
              height: _controller!.value.size.height > 0 ? _controller!.value.size.height : 100,
              child: VideoPlayer(_controller!),
            ),
          ),
        ),
      );
    }
    return SizedBox(
      width: widget.width,
      height: widget.height,
      child: const ColoredBox(
        color: ZeereTheme.aqua,
        child: Center(child: Icon(Icons.videocam_rounded, color: ZeereTheme.teal)),
      ),
    );
  }
}

class AsyncContent<T> extends StatelessWidget {
  const AsyncContent({
    super.key,
    required this.value,
    required this.builder,
    required this.onRetry,
    this.emptyMessage = 'Nothing to show yet.',
  });
  final AsyncValue<T> value;
  final Widget Function(T value) builder;
  final VoidCallback onRetry;
  final String emptyMessage;

  @override
  Widget build(BuildContext context) => value.when(
    data: builder,
    loading: () => const _LoadingState(),
    error: (Object _, StackTrace _) => _ErrorState(onRetry: onRetry),
  );
}

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.message,
    this.icon = Icons.inbox_outlined,
  });
  final String message;
  final IconData icon;
  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Icon(icon, size: 46, color: ZeereTheme.muted),
          const SizedBox(height: 12),
          Text(message, textAlign: TextAlign.center),
        ],
      ),
    ),
  );
}

class _LoadingState extends StatelessWidget {
  const _LoadingState();
  @override
  Widget build(BuildContext context) => const Center(
    child: Padding(
      padding: EdgeInsets.all(36),
      child: CircularProgressIndicator(),
    ),
  );
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.onRetry});
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          const Icon(
            Icons.cloud_off_outlined,
            size: 46,
            color: ZeereTheme.muted,
          ),
          const SizedBox(height: 12),
          const Text(
            'We could not load this right now.',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: const Text('Try again'),
          ),
        ],
      ),
    ),
  );
}

class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key, required this.isOnline});
  final bool isOnline;
  @override
  Widget build(BuildContext context) => isOnline
      ? const SizedBox.shrink()
      : const MaterialBanner(
          content: Text(
            'You appear to be offline. Visible information is still available.',
          ),
          leading: Icon(Icons.wifi_off_outlined),
          actions: <Widget>[SizedBox.shrink()],
        );
}
