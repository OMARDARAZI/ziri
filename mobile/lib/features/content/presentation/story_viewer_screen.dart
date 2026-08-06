import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:video_player/video_player.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/utils/image_url.dart';
import '../domain/content_models.dart';

class StoryViewerScreen extends StatefulWidget {
  const StoryViewerScreen({
    super.key,
    required this.stories,
    this.initialIndex = 0,
  });

  final List<Story> stories;
  final int initialIndex;

  @override
  State<StoryViewerScreen> createState() => _StoryViewerScreenState();
}

class _StoryViewerScreenState extends State<StoryViewerScreen> {
  late PageController _pageController;
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex.clamp(
      0,
      widget.stories.isNotEmpty ? widget.stories.length - 1 : 0,
    );
    _pageController = PageController(initialPage: _currentIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onStoryComplete() {
    if (_currentIndex < widget.stories.length - 1) {
      setState(() => _currentIndex++);
      _pageController.animateToPage(
        _currentIndex,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      if (mounted && context.canPop()) {
        context.pop();
      }
    }
  }

  void _onPreviousStory() {
    if (_currentIndex > 0) {
      setState(() => _currentIndex--);
      _pageController.animateToPage(
        _currentIndex,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.stories.isEmpty) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: IconButton(
            icon: const Icon(Icons.close, color: Colors.white, size: 30),
            onPressed: () => context.pop(),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: PageView.builder(
        controller: _pageController,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: widget.stories.length,
        itemBuilder: (BuildContext context, int index) {
          final story = widget.stories[index];
          return _SingleStoryItem(
            key: ValueKey<String>('story_${story.id}_$index'),
            story: story,
            storiesCount: widget.stories.length,
            currentIndex: index,
            onComplete: _onStoryComplete,
            onPrevious: _onPreviousStory,
            onClose: () {
              if (mounted && context.canPop()) {
                context.pop();
              }
            },
          );
        },
      ),
    );
  }
}

class _SingleStoryItem extends StatefulWidget {
  const _SingleStoryItem({
    super.key,
    required this.story,
    required this.storiesCount,
    required this.currentIndex,
    required this.onComplete,
    required this.onPrevious,
    required this.onClose,
  });

  final Story story;
  final int storiesCount;
  final int currentIndex;
  final VoidCallback onComplete;
  final VoidCallback onPrevious;
  final VoidCallback onClose;

  @override
  State<_SingleStoryItem> createState() => _SingleStoryItemState();
}

class _SingleStoryItemState extends State<_SingleStoryItem>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  VideoPlayerController? _videoController;
  bool _isVideo = false;
  bool _isLoading = true;
  bool _isPaused = false;
  String _resolvedUrl = '';

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(vsync: this);
    _animController.addStatusListener((AnimationStatus status) {
      if (status == AnimationStatus.completed) {
        widget.onComplete();
      }
    });

    final rawPath = widget.story.image ?? '';
    _resolvedUrl = resolveImageUrl(rawPath) ?? '';
    _isVideo = isVideoUrl(rawPath) ||
        isVideoUrl(_resolvedUrl) ||
        rawPath.toLowerCase().contains('.mp4') ||
        _resolvedUrl.toLowerCase().contains('.mp4');

    if (_isVideo && _resolvedUrl.isNotEmpty) {
      _initVideoPlayer(_resolvedUrl);
    } else {
      _initImageStory();
    }
  }

  void _initImageStory() {
    if (!mounted) return;
    setState(() => _isLoading = false);
    _animController.duration = const Duration(seconds: 5);
    unawaited(_animController.forward(from: 0.0));
  }

  Future<void> _initVideoPlayer(String url) async {
    try {
      final controller = VideoPlayerController.networkUrl(
        Uri.parse(url),
        videoPlayerOptions: VideoPlayerOptions(mixWithOthers: true),
      );
      _videoController = controller;
      await controller.initialize();
      if (!mounted || _videoController != controller) return;

      await controller.setLooping(true);
      await controller.setVolume(1.0);
      await controller.play();

      if (mounted) {
        setState(() => _isLoading = false);
        final duration = controller.value.duration;
        _animController.duration = duration > Duration.zero
            ? duration
            : const Duration(seconds: 10);
        unawaited(_animController.forward(from: 0.0));
      }
    } catch (err) {
      debugPrint('Video init error ($url): $err');
      if (url.contains('127.0.0.1')) {
        final fallback = url.replaceAll('127.0.0.1', 'localhost');
        await _initVideoPlayer(fallback);
        return;
      }
      if (url.contains('localhost')) {
        final fallback = url.replaceAll('localhost', '127.0.0.1');
        await _initVideoPlayer(fallback);
        return;
      }
      if (!mounted) return;
      _initImageStory();
    }
  }

  @override
  void dispose() {
    _animController.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  void _pause() {
    if (_isPaused) return;
    setState(() => _isPaused = true);
    _animController.stop();
    _videoController?.pause();
  }

  void _resume() {
    if (!_isPaused) return;
    setState(() => _isPaused = false);
    _animController.forward();
    _videoController?.play();
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;

    return GestureDetector(
      onLongPressStart: (_) => _pause(),
      onLongPressEnd: (_) => _resume(),
      onTapUp: (TapUpDetails details) {
        if (_isPaused) {
          _resume();
          return;
        }
        final dx = details.globalPosition.dx;
        if (dx < screenWidth * 0.35) {
          widget.onPrevious();
        } else {
          widget.onComplete();
        }
      },
      child: Stack(
        fit: StackFit.expand,
        children: <Widget>[
          // Media Content
          if (_isVideo)
            (_videoController != null && _videoController!.value.isInitialized
                ? SizedBox.expand(
                    child: FittedBox(
                      fit: BoxFit.cover,
                      child: SizedBox(
                        width: _videoController!.value.size.width > 0
                            ? _videoController!.value.size.width
                            : 1080,
                        height: _videoController!.value.size.height > 0
                            ? _videoController!.value.size.height
                            : 1920,
                        child: VideoPlayer(_videoController!),
                      ),
                    ),
                  )
                : Container(color: Colors.black))
          else
            Image.network(
              _resolvedUrl,
              fit: BoxFit.cover,
              errorBuilder: (
                BuildContext context,
                Object error,
                StackTrace? stackTrace,
              ) {
                debugPrint('❌ Story image failed to load ($_resolvedUrl): $error');
                return Image.network(
                  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
                  fit: BoxFit.cover,
                );
              },
            ),

          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(color: Colors.white),
            ),

          // Top Gradient Overlay
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 160,
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: <Color>[Colors.black87, Colors.transparent],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ),

          // Top Bar Header & Progress Indicators
          SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                // Progress Bars
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 8,
                  ),
                  child: Row(
                    children: List<Widget>.generate(
                      widget.storiesCount,
                      (int idx) {
                        return Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 2.0,
                            ),
                            child: AnimatedBuilder(
                              animation: _animController,
                              builder: (
                                BuildContext context,
                                Widget? child,
                              ) {
                                double val = 0.0;
                                if (idx < widget.currentIndex) {
                                  val = 1.0;
                                } else if (idx == widget.currentIndex) {
                                  val = _animController.value;
                                } else {
                                  val = 0.0;
                                }
                                return ClipRRect(
                                  borderRadius: BorderRadius.circular(2),
                                  child: LinearProgressIndicator(
                                    value: val,
                                    backgroundColor: Colors.white30,
                                    valueColor:
                                        const AlwaysStoppedAnimation<Color>(
                                          Colors.white,
                                        ),
                                    minHeight: 2.5,
                                  ),
                                );
                              },
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),

                // Title & Close Button
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 4,
                  ),
                  child: Row(
                    children: <Widget>[
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text(
                              widget.story.title,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 15,
                              ),
                            ),
                            if (widget.story.storyTime != null)
                              Text(
                                ZeereFormatters.relativeTime(
                                  widget.story.storyTime,
                                ),
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 12,
                                ),
                              ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(
                          Icons.close,
                          color: Colors.white,
                          size: 26,
                        ),
                        onPressed: widget.onClose,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
