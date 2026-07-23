import 'package:flutter_riverpod/flutter_riverpod.dart';

class MyNotifier extends Notifier<int> {
  @override
  int build() => 0;
}

final myProvider = NotifierProvider.autoDispose<MyNotifier, int>(MyNotifier.new);
