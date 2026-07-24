import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
    final url = resolveImageUrl(image);
    if (url == null) return _fallback();
    return Semantics(
      image: true,
      label: label,
      child: CachedNetworkImage(
        imageUrl: url,
        height: height,
        width: width,
        fit: fit,
        fadeInDuration: Duration.zero,
        placeholder: (_, _) => _fallback(),
        errorWidget: (_, _, _) => _fallback(),
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
          actions: <Widget>[],
        );
}
