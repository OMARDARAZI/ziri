import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app_providers.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/validators.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeIn,
    );
    _scaleAnimation = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOutBack,
      ),
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: <Color>[
              Color(0xFF0F172A),
              Color(0xFF1B3A5C),
              Color(0xFF0A192F),
            ],
          ),
        ),
        child: Stack(
          children: <Widget>[
            // Ambient Radial Glow
            Center(
              child: Container(
                width: 280,
                height: 280,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: <Color>[
                      const Color(0xFF2E7D9A).withOpacity(0.25),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),

            // Content
            SafeArea(
              child: Center(
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: ScaleTransition(
                    scale: _scaleAnimation,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: <Widget>[
                        // Brand Icon Container
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withOpacity(0.08),
                            border: Border.all(
                              color: const Color(0xFFF4C430).withOpacity(0.6),
                              width: 2,
                            ),
                            boxShadow: <BoxShadow>[
                              BoxShadow(
                                color: const Color(0xFF2E7D9A).withOpacity(0.3),
                                blurRadius: 30,
                                spreadRadius: 5,
                              ),
                            ],
                          ),
                          child: ClipOval(
                            child: Image.asset(
                              'assets/brand/zeera_logo.jpeg',
                              width: 80,
                              height: 80,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return const Icon(
                                  Icons.explore,
                                  size: 80,
                                  color: Color(0xFFF4C430),
                                );
                              },
                            ),
                          ),
                        ),
                        const SizedBox(height: 28),

                        // Title
                        const Text(
                          'ZEERA',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 32,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 8,
                          ),
                        ),
                        const SizedBox(height: 8),

                        // Tagline
                        const Text(
                          'ISLAND EXPERIENCES & SERVICES',
                          style: TextStyle(
                            color: Color(0xFFF4C430),
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 3,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // Bottom loading indicator
            Positioned(
              bottom: 48,
              left: 0,
              right: 0,
              child: Column(
                children: <Widget>[
                  const SizedBox(
                    width: 32,
                    height: 32,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        Color(0xFF2E7D9A),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'DISCOVER BCHARRE',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.5),
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 2.5,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  CountryCode _selectedCountry = defaultCountryCodes.first;
  bool _loading = false;
  bool _obscure = true;

  @override
  void dispose() {
    _phone.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final fullPhone = Validators.normalizePhone(_phone.text, countryCode: _selectedCountry.code);
      await ref
          .read(sessionProvider.notifier)
          .login(phone: fullPhone, password: _password.text);
      if (mounted) context.go(_safeDestination());
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _safeDestination() {
    final from = GoRouterState.of(context).uri.queryParameters['from'];
    return from != null && from.startsWith('/') && !from.startsWith('//')
        ? from
        : '/home';
  }

  @override
  Widget build(BuildContext context) => _AuthScaffold(
    title: 'Welcome back',
    subtitle: 'Sign in to manage your island experiences.',
    child: Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Container(
                height: 56,
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(12),
                ),
                alignment: Alignment.center,
                child: const Text(
                  '🇱🇧 +961',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    color: Color(0xFF1B3A5C),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextFormField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  validator: Validators.phone,
                  decoration: const InputDecoration(
                    labelText: 'Phone number',
                    hintText: '70 123 456',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _password,
            obscureText: _obscure,
            validator: Validators.required,
            decoration: InputDecoration(
              labelText: 'Password',
              suffixIcon: IconButton(
                onPressed: () => setState(() => _obscure = !_obscure),
                icon: Icon(
                  _obscure
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                ),
                tooltip: 'Show password',
              ),
            ),
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () => context.push('/forgot-password'),
              style: TextButton.styleFrom(
                visualDensity: VisualDensity.compact,
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
              ),
              child: const Text(
                'Forgot password?',
                style: TextStyle(
                  color: ZeereTheme.teal,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _loading ? null : _submit,
            child: _loading
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text('Log in'),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => context.go('/register'),
            child: const Text('New to Zeera? Create an account'),
          ),
        ],
      ),
    ),
  );
}

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _phoneFormKey = GlobalKey<FormState>();
  final _otpFormKey = GlobalKey<FormState>();
  final _resetFormKey = GlobalKey<FormState>();

  final _phone = TextEditingController();
  final _code = TextEditingController();
  final _newPassword = TextEditingController();
  final _confirmPassword = TextEditingController();

  int _step = 1;
  bool _loading = false;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  String? _resetToken;

  @override
  void dispose() {
    _phone.dispose();
    _code.dispose();
    _newPassword.dispose();
    _confirmPassword.dispose();
    super.dispose();
  }

  Future<void> _requestOtp() async {
    if (!_phoneFormKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final fullPhone = Validators.normalizePhone(_phone.text, countryCode: defaultCountryCodes.first.code);
      final devCode = await ref.read(authRepositoryProvider).requestPasswordReset(phone: fullPhone);
      if (devCode != null && devCode.isNotEmpty && mounted) {
        _code.text = devCode;
      }
      if (mounted) {
        setState(() {
          _step = 2;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Verification code sent to your phone.')),
        );
      }
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.message)),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verifyOtp() async {
    if (!_otpFormKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final fullPhone = Validators.normalizePhone(_phone.text, countryCode: defaultCountryCodes.first.code);
      final token = await ref.read(authRepositoryProvider).verifyPasswordResetOtp(
        phone: fullPhone,
        code: _code.text.trim(),
      );
      if (mounted) {
        setState(() {
          _resetToken = token;
          _step = 3;
        });
      }
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.message)),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _resetPassword() async {
    if (!_resetFormKey.currentState!.validate()) return;
    if (_resetToken == null) {
      setState(() => _step = 1);
      return;
    }
    setState(() => _loading = true);
    try {
      final fullPhone = Validators.normalizePhone(_phone.text, countryCode: defaultCountryCodes.first.code);
      await ref.read(authRepositoryProvider).resetPasswordWithToken(
        phone: fullPhone,
        resetToken: _resetToken!,
        newPassword: _newPassword.text,
        confirmation: _confirmPassword.text,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Password reset successfully. Please log in.'),
            backgroundColor: ZeereTheme.teal,
          ),
        );
        context.go('/login');
      }
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.message)),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    String title = 'Forgot password';
    String subtitle = 'Enter your phone number to reset your password.';
    if (_step == 2) {
      title = 'Verify code';
      subtitle = 'Enter the 6-digit code sent to ${_phone.text}.';
    } else if (_step == 3) {
      title = 'New password';
      subtitle = 'Create a secure new password for your account.';
    }

    return _AuthScaffold(
      title: title,
      subtitle: subtitle,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: _step == 1
            ? _buildStep1()
            : _step == 2
                ? _buildStep2()
                : _buildStep3(),
      ),
    );
  }

  Widget _buildStep1() {
    return Form(
      key: _phoneFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Container(
                height: 56,
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(12),
                ),
                alignment: Alignment.center,
                child: const Text(
                  '🇱🇧 +961',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    color: Color(0xFF1B3A5C),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextFormField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  validator: Validators.phone,
                  decoration: const InputDecoration(
                    labelText: 'Phone number',
                    hintText: '70 123 456',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _loading ? null : _requestOtp,
            child: _loading
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text('Send verification code'),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => context.go('/login'),
            child: const Text('Remember your password? Log in'),
          ),
        ],
      ),
    );
  }

  Widget _buildStep2() {
    return Form(
      key: _otpFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          TextFormField(
            controller: _code,
            keyboardType: TextInputType.number,
            maxLength: 6,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              letterSpacing: 8,
              color: ZeereTheme.navy,
            ),
            validator: (val) {
              if (val == null || val.trim().length != 6) {
                return 'Enter the 6-digit code';
              }
              return null;
            },
            decoration: const InputDecoration(
              labelText: 'Verification code',
              hintText: '123456',
              counterText: '',
            ),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _loading ? null : _verifyOtp,
            child: _loading
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text('Verify code'),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              TextButton(
                onPressed: _loading ? null : _requestOtp,
                child: const Text('Resend code'),
              ),
              const Text(' • ', style: TextStyle(color: Colors.grey)),
              TextButton(
                onPressed: () => setState(() => _step = 1),
                child: const Text('Change phone'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStep3() {
    return Form(
      key: _resetFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          TextFormField(
            controller: _newPassword,
            obscureText: _obscureNew,
            validator: Validators.password,
            decoration: InputDecoration(
              labelText: 'New password',
              suffixIcon: IconButton(
                onPressed: () => setState(() => _obscureNew = !_obscureNew),
                icon: Icon(
                  _obscureNew
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                ),
                tooltip: 'Show password',
              ),
            ),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _confirmPassword,
            obscureText: _obscureConfirm,
            validator: (val) {
              if (val != _newPassword.text) {
                return 'Passwords do not match';
              }
              return null;
            },
            decoration: InputDecoration(
              labelText: 'Confirm new password',
              suffixIcon: IconButton(
                onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                icon: Icon(
                  _obscureConfirm
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                ),
                tooltip: 'Show password',
              ),
            ),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _loading ? null : _resetPassword,
            child: _loading
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text('Reset password'),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => context.go('/login'),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }
}

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});
  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  CountryCode _selectedCountry = defaultCountryCodes.first;
  bool _loading = false;

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final fullPhone = Validators.normalizePhone(_phone.text, countryCode: _selectedCountry.code);
      await ref
          .read(sessionProvider.notifier)
          .register(
            name: _name.text,
            phone: fullPhone,
            password: _password.text,
            confirmation: _confirm.text,
          );
      if (mounted) context.go('/home');
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => _AuthScaffold(
    title: 'Create your account',
    subtitle: 'Book trusted island services and activities with Zeera.',
    child: Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          TextFormField(
            controller: _name,
            textCapitalization: TextCapitalization.words,
            validator: (String? value) =>
                Validators.required(value, label: 'Full name'),
            decoration: const InputDecoration(labelText: 'Full name'),
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Container(
                height: 56,
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(12),
                ),
                alignment: Alignment.center,
                child: const Text(
                  '🇱🇧 +961',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    color: Color(0xFF1B3A5C),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextFormField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  validator: Validators.phone,
                  decoration: const InputDecoration(
                    labelText: 'Phone number',
                    hintText: '70 123 456',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _password,
            obscureText: true,
            validator: Validators.password,
            decoration: const InputDecoration(labelText: 'Password'),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _confirm,
            obscureText: true,
            validator: (String? value) => value != _password.text
                ? 'Password confirmation does not match'
                : Validators.required(value),
            decoration: const InputDecoration(labelText: 'Confirm password'),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _loading ? null : _submit,
            child: _loading
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text('Create account'),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => context.go('/login'),
            child: const Text('Already have an account? Log in'),
          ),
        ],
      ),
    ),
  );
}

class _AuthScaffold extends StatelessWidget {
  const _AuthScaffold({
    required this.title,
    required this.subtitle,
    required this.child,
  });
  final String title;
  final String subtitle;
  final Widget child;
  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const Text(
                  'ZEERE',
                  style: TextStyle(
                    color: ZeereTheme.teal,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 4,
                  ),
                ),
                const SizedBox(height: 40),
                Text(
                  title,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: ZeereTheme.navy,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  subtitle,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyLarge?.copyWith(color: ZeereTheme.muted),
                ),
                const SizedBox(height: 32),
                child,
              ],
            ),
          ),
        ),
      ),
    ),
  );
}
