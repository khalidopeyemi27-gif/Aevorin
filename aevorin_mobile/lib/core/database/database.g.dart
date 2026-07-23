// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'database.dart';

// ignore_for_file: type=lint
class $DraftsTable extends Drafts with TableInfo<$DraftsTable, Draft> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $DraftsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _sceneIdMeta = const VerificationMeta(
    'sceneId',
  );
  @override
  late final GeneratedColumn<String> sceneId = GeneratedColumn<String>(
    'scene_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways('UNIQUE'),
  );
  static const VerificationMeta _contentDeltaMeta = const VerificationMeta(
    'contentDelta',
  );
  @override
  late final GeneratedColumn<String> contentDelta = GeneratedColumn<String>(
    'content_delta',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _contentHashMeta = const VerificationMeta(
    'contentHash',
  );
  @override
  late final GeneratedColumn<String> contentHash = GeneratedColumn<String>(
    'content_hash',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _formatVersionMeta = const VerificationMeta(
    'formatVersion',
  );
  @override
  late final GeneratedColumn<String> formatVersion = GeneratedColumn<String>(
    'format_version',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('delta-v1'),
  );
  @override
  late final GeneratedColumnWithTypeConverter<DraftSyncState, int> syncState =
      GeneratedColumn<int>(
        'sync_state',
        aliasedName,
        false,
        type: DriftSqlType.int,
        requiredDuringInsert: false,
        defaultValue: const Constant(0),
      ).withConverter<DraftSyncState>($DraftsTable.$convertersyncState);
  static const VerificationMeta _wordCountMeta = const VerificationMeta(
    'wordCount',
  );
  @override
  late final GeneratedColumn<int> wordCount = GeneratedColumn<int>(
    'word_count',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _lastSavedMeta = const VerificationMeta(
    'lastSaved',
  );
  @override
  late final GeneratedColumn<DateTime> lastSaved = GeneratedColumn<DateTime>(
    'last_saved',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _lastSyncedAtMeta = const VerificationMeta(
    'lastSyncedAt',
  );
  @override
  late final GeneratedColumn<DateTime> lastSyncedAt = GeneratedColumn<DateTime>(
    'last_synced_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _deviceIdMeta = const VerificationMeta(
    'deviceId',
  );
  @override
  late final GeneratedColumn<String> deviceId = GeneratedColumn<String>(
    'device_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _serverVersionMeta = const VerificationMeta(
    'serverVersion',
  );
  @override
  late final GeneratedColumn<int> serverVersion = GeneratedColumn<int>(
    'server_version',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    sceneId,
    contentDelta,
    contentHash,
    formatVersion,
    syncState,
    wordCount,
    lastSaved,
    lastSyncedAt,
    deviceId,
    serverVersion,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'drafts';
  @override
  VerificationContext validateIntegrity(
    Insertable<Draft> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('scene_id')) {
      context.handle(
        _sceneIdMeta,
        sceneId.isAcceptableOrUnknown(data['scene_id']!, _sceneIdMeta),
      );
    } else if (isInserting) {
      context.missing(_sceneIdMeta);
    }
    if (data.containsKey('content_delta')) {
      context.handle(
        _contentDeltaMeta,
        contentDelta.isAcceptableOrUnknown(
          data['content_delta']!,
          _contentDeltaMeta,
        ),
      );
    }
    if (data.containsKey('content_hash')) {
      context.handle(
        _contentHashMeta,
        contentHash.isAcceptableOrUnknown(
          data['content_hash']!,
          _contentHashMeta,
        ),
      );
    }
    if (data.containsKey('format_version')) {
      context.handle(
        _formatVersionMeta,
        formatVersion.isAcceptableOrUnknown(
          data['format_version']!,
          _formatVersionMeta,
        ),
      );
    }
    if (data.containsKey('word_count')) {
      context.handle(
        _wordCountMeta,
        wordCount.isAcceptableOrUnknown(data['word_count']!, _wordCountMeta),
      );
    }
    if (data.containsKey('last_saved')) {
      context.handle(
        _lastSavedMeta,
        lastSaved.isAcceptableOrUnknown(data['last_saved']!, _lastSavedMeta),
      );
    } else if (isInserting) {
      context.missing(_lastSavedMeta);
    }
    if (data.containsKey('last_synced_at')) {
      context.handle(
        _lastSyncedAtMeta,
        lastSyncedAt.isAcceptableOrUnknown(
          data['last_synced_at']!,
          _lastSyncedAtMeta,
        ),
      );
    }
    if (data.containsKey('device_id')) {
      context.handle(
        _deviceIdMeta,
        deviceId.isAcceptableOrUnknown(data['device_id']!, _deviceIdMeta),
      );
    }
    if (data.containsKey('server_version')) {
      context.handle(
        _serverVersionMeta,
        serverVersion.isAcceptableOrUnknown(
          data['server_version']!,
          _serverVersionMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Draft map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Draft(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      sceneId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}scene_id'],
      )!,
      contentDelta: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}content_delta'],
      ),
      contentHash: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}content_hash'],
      ),
      formatVersion: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}format_version'],
      )!,
      syncState: $DraftsTable.$convertersyncState.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.int,
          data['${effectivePrefix}sync_state'],
        )!,
      ),
      wordCount: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}word_count'],
      )!,
      lastSaved: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_saved'],
      )!,
      lastSyncedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_synced_at'],
      ),
      deviceId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}device_id'],
      ),
      serverVersion: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}server_version'],
      ),
    );
  }

  @override
  $DraftsTable createAlias(String alias) {
    return $DraftsTable(attachedDatabase, alias);
  }

  static JsonTypeConverter2<DraftSyncState, int, int> $convertersyncState =
      const EnumIndexConverter<DraftSyncState>(DraftSyncState.values);
}

class Draft extends DataClass implements Insertable<Draft> {
  final int id;
  final String sceneId;
  final String? contentDelta;
  final String? contentHash;
  final String formatVersion;
  final DraftSyncState syncState;
  final int wordCount;
  final DateTime lastSaved;
  final DateTime? lastSyncedAt;
  final String? deviceId;
  final int? serverVersion;
  const Draft({
    required this.id,
    required this.sceneId,
    this.contentDelta,
    this.contentHash,
    required this.formatVersion,
    required this.syncState,
    required this.wordCount,
    required this.lastSaved,
    this.lastSyncedAt,
    this.deviceId,
    this.serverVersion,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['scene_id'] = Variable<String>(sceneId);
    if (!nullToAbsent || contentDelta != null) {
      map['content_delta'] = Variable<String>(contentDelta);
    }
    if (!nullToAbsent || contentHash != null) {
      map['content_hash'] = Variable<String>(contentHash);
    }
    map['format_version'] = Variable<String>(formatVersion);
    {
      map['sync_state'] = Variable<int>(
        $DraftsTable.$convertersyncState.toSql(syncState),
      );
    }
    map['word_count'] = Variable<int>(wordCount);
    map['last_saved'] = Variable<DateTime>(lastSaved);
    if (!nullToAbsent || lastSyncedAt != null) {
      map['last_synced_at'] = Variable<DateTime>(lastSyncedAt);
    }
    if (!nullToAbsent || deviceId != null) {
      map['device_id'] = Variable<String>(deviceId);
    }
    if (!nullToAbsent || serverVersion != null) {
      map['server_version'] = Variable<int>(serverVersion);
    }
    return map;
  }

  DraftsCompanion toCompanion(bool nullToAbsent) {
    return DraftsCompanion(
      id: Value(id),
      sceneId: Value(sceneId),
      contentDelta: contentDelta == null && nullToAbsent
          ? const Value.absent()
          : Value(contentDelta),
      contentHash: contentHash == null && nullToAbsent
          ? const Value.absent()
          : Value(contentHash),
      formatVersion: Value(formatVersion),
      syncState: Value(syncState),
      wordCount: Value(wordCount),
      lastSaved: Value(lastSaved),
      lastSyncedAt: lastSyncedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(lastSyncedAt),
      deviceId: deviceId == null && nullToAbsent
          ? const Value.absent()
          : Value(deviceId),
      serverVersion: serverVersion == null && nullToAbsent
          ? const Value.absent()
          : Value(serverVersion),
    );
  }

  factory Draft.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Draft(
      id: serializer.fromJson<int>(json['id']),
      sceneId: serializer.fromJson<String>(json['sceneId']),
      contentDelta: serializer.fromJson<String?>(json['contentDelta']),
      contentHash: serializer.fromJson<String?>(json['contentHash']),
      formatVersion: serializer.fromJson<String>(json['formatVersion']),
      syncState: $DraftsTable.$convertersyncState.fromJson(
        serializer.fromJson<int>(json['syncState']),
      ),
      wordCount: serializer.fromJson<int>(json['wordCount']),
      lastSaved: serializer.fromJson<DateTime>(json['lastSaved']),
      lastSyncedAt: serializer.fromJson<DateTime?>(json['lastSyncedAt']),
      deviceId: serializer.fromJson<String?>(json['deviceId']),
      serverVersion: serializer.fromJson<int?>(json['serverVersion']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'sceneId': serializer.toJson<String>(sceneId),
      'contentDelta': serializer.toJson<String?>(contentDelta),
      'contentHash': serializer.toJson<String?>(contentHash),
      'formatVersion': serializer.toJson<String>(formatVersion),
      'syncState': serializer.toJson<int>(
        $DraftsTable.$convertersyncState.toJson(syncState),
      ),
      'wordCount': serializer.toJson<int>(wordCount),
      'lastSaved': serializer.toJson<DateTime>(lastSaved),
      'lastSyncedAt': serializer.toJson<DateTime?>(lastSyncedAt),
      'deviceId': serializer.toJson<String?>(deviceId),
      'serverVersion': serializer.toJson<int?>(serverVersion),
    };
  }

  Draft copyWith({
    int? id,
    String? sceneId,
    Value<String?> contentDelta = const Value.absent(),
    Value<String?> contentHash = const Value.absent(),
    String? formatVersion,
    DraftSyncState? syncState,
    int? wordCount,
    DateTime? lastSaved,
    Value<DateTime?> lastSyncedAt = const Value.absent(),
    Value<String?> deviceId = const Value.absent(),
    Value<int?> serverVersion = const Value.absent(),
  }) => Draft(
    id: id ?? this.id,
    sceneId: sceneId ?? this.sceneId,
    contentDelta: contentDelta.present ? contentDelta.value : this.contentDelta,
    contentHash: contentHash.present ? contentHash.value : this.contentHash,
    formatVersion: formatVersion ?? this.formatVersion,
    syncState: syncState ?? this.syncState,
    wordCount: wordCount ?? this.wordCount,
    lastSaved: lastSaved ?? this.lastSaved,
    lastSyncedAt: lastSyncedAt.present ? lastSyncedAt.value : this.lastSyncedAt,
    deviceId: deviceId.present ? deviceId.value : this.deviceId,
    serverVersion: serverVersion.present
        ? serverVersion.value
        : this.serverVersion,
  );
  Draft copyWithCompanion(DraftsCompanion data) {
    return Draft(
      id: data.id.present ? data.id.value : this.id,
      sceneId: data.sceneId.present ? data.sceneId.value : this.sceneId,
      contentDelta: data.contentDelta.present
          ? data.contentDelta.value
          : this.contentDelta,
      contentHash: data.contentHash.present
          ? data.contentHash.value
          : this.contentHash,
      formatVersion: data.formatVersion.present
          ? data.formatVersion.value
          : this.formatVersion,
      syncState: data.syncState.present ? data.syncState.value : this.syncState,
      wordCount: data.wordCount.present ? data.wordCount.value : this.wordCount,
      lastSaved: data.lastSaved.present ? data.lastSaved.value : this.lastSaved,
      lastSyncedAt: data.lastSyncedAt.present
          ? data.lastSyncedAt.value
          : this.lastSyncedAt,
      deviceId: data.deviceId.present ? data.deviceId.value : this.deviceId,
      serverVersion: data.serverVersion.present
          ? data.serverVersion.value
          : this.serverVersion,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Draft(')
          ..write('id: $id, ')
          ..write('sceneId: $sceneId, ')
          ..write('contentDelta: $contentDelta, ')
          ..write('contentHash: $contentHash, ')
          ..write('formatVersion: $formatVersion, ')
          ..write('syncState: $syncState, ')
          ..write('wordCount: $wordCount, ')
          ..write('lastSaved: $lastSaved, ')
          ..write('lastSyncedAt: $lastSyncedAt, ')
          ..write('deviceId: $deviceId, ')
          ..write('serverVersion: $serverVersion')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    sceneId,
    contentDelta,
    contentHash,
    formatVersion,
    syncState,
    wordCount,
    lastSaved,
    lastSyncedAt,
    deviceId,
    serverVersion,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Draft &&
          other.id == this.id &&
          other.sceneId == this.sceneId &&
          other.contentDelta == this.contentDelta &&
          other.contentHash == this.contentHash &&
          other.formatVersion == this.formatVersion &&
          other.syncState == this.syncState &&
          other.wordCount == this.wordCount &&
          other.lastSaved == this.lastSaved &&
          other.lastSyncedAt == this.lastSyncedAt &&
          other.deviceId == this.deviceId &&
          other.serverVersion == this.serverVersion);
}

class DraftsCompanion extends UpdateCompanion<Draft> {
  final Value<int> id;
  final Value<String> sceneId;
  final Value<String?> contentDelta;
  final Value<String?> contentHash;
  final Value<String> formatVersion;
  final Value<DraftSyncState> syncState;
  final Value<int> wordCount;
  final Value<DateTime> lastSaved;
  final Value<DateTime?> lastSyncedAt;
  final Value<String?> deviceId;
  final Value<int?> serverVersion;
  const DraftsCompanion({
    this.id = const Value.absent(),
    this.sceneId = const Value.absent(),
    this.contentDelta = const Value.absent(),
    this.contentHash = const Value.absent(),
    this.formatVersion = const Value.absent(),
    this.syncState = const Value.absent(),
    this.wordCount = const Value.absent(),
    this.lastSaved = const Value.absent(),
    this.lastSyncedAt = const Value.absent(),
    this.deviceId = const Value.absent(),
    this.serverVersion = const Value.absent(),
  });
  DraftsCompanion.insert({
    this.id = const Value.absent(),
    required String sceneId,
    this.contentDelta = const Value.absent(),
    this.contentHash = const Value.absent(),
    this.formatVersion = const Value.absent(),
    this.syncState = const Value.absent(),
    this.wordCount = const Value.absent(),
    required DateTime lastSaved,
    this.lastSyncedAt = const Value.absent(),
    this.deviceId = const Value.absent(),
    this.serverVersion = const Value.absent(),
  }) : sceneId = Value(sceneId),
       lastSaved = Value(lastSaved);
  static Insertable<Draft> custom({
    Expression<int>? id,
    Expression<String>? sceneId,
    Expression<String>? contentDelta,
    Expression<String>? contentHash,
    Expression<String>? formatVersion,
    Expression<int>? syncState,
    Expression<int>? wordCount,
    Expression<DateTime>? lastSaved,
    Expression<DateTime>? lastSyncedAt,
    Expression<String>? deviceId,
    Expression<int>? serverVersion,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (sceneId != null) 'scene_id': sceneId,
      if (contentDelta != null) 'content_delta': contentDelta,
      if (contentHash != null) 'content_hash': contentHash,
      if (formatVersion != null) 'format_version': formatVersion,
      if (syncState != null) 'sync_state': syncState,
      if (wordCount != null) 'word_count': wordCount,
      if (lastSaved != null) 'last_saved': lastSaved,
      if (lastSyncedAt != null) 'last_synced_at': lastSyncedAt,
      if (deviceId != null) 'device_id': deviceId,
      if (serverVersion != null) 'server_version': serverVersion,
    });
  }

  DraftsCompanion copyWith({
    Value<int>? id,
    Value<String>? sceneId,
    Value<String?>? contentDelta,
    Value<String?>? contentHash,
    Value<String>? formatVersion,
    Value<DraftSyncState>? syncState,
    Value<int>? wordCount,
    Value<DateTime>? lastSaved,
    Value<DateTime?>? lastSyncedAt,
    Value<String?>? deviceId,
    Value<int?>? serverVersion,
  }) {
    return DraftsCompanion(
      id: id ?? this.id,
      sceneId: sceneId ?? this.sceneId,
      contentDelta: contentDelta ?? this.contentDelta,
      contentHash: contentHash ?? this.contentHash,
      formatVersion: formatVersion ?? this.formatVersion,
      syncState: syncState ?? this.syncState,
      wordCount: wordCount ?? this.wordCount,
      lastSaved: lastSaved ?? this.lastSaved,
      lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
      deviceId: deviceId ?? this.deviceId,
      serverVersion: serverVersion ?? this.serverVersion,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (sceneId.present) {
      map['scene_id'] = Variable<String>(sceneId.value);
    }
    if (contentDelta.present) {
      map['content_delta'] = Variable<String>(contentDelta.value);
    }
    if (contentHash.present) {
      map['content_hash'] = Variable<String>(contentHash.value);
    }
    if (formatVersion.present) {
      map['format_version'] = Variable<String>(formatVersion.value);
    }
    if (syncState.present) {
      map['sync_state'] = Variable<int>(
        $DraftsTable.$convertersyncState.toSql(syncState.value),
      );
    }
    if (wordCount.present) {
      map['word_count'] = Variable<int>(wordCount.value);
    }
    if (lastSaved.present) {
      map['last_saved'] = Variable<DateTime>(lastSaved.value);
    }
    if (lastSyncedAt.present) {
      map['last_synced_at'] = Variable<DateTime>(lastSyncedAt.value);
    }
    if (deviceId.present) {
      map['device_id'] = Variable<String>(deviceId.value);
    }
    if (serverVersion.present) {
      map['server_version'] = Variable<int>(serverVersion.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('DraftsCompanion(')
          ..write('id: $id, ')
          ..write('sceneId: $sceneId, ')
          ..write('contentDelta: $contentDelta, ')
          ..write('contentHash: $contentHash, ')
          ..write('formatVersion: $formatVersion, ')
          ..write('syncState: $syncState, ')
          ..write('wordCount: $wordCount, ')
          ..write('lastSaved: $lastSaved, ')
          ..write('lastSyncedAt: $lastSyncedAt, ')
          ..write('deviceId: $deviceId, ')
          ..write('serverVersion: $serverVersion')
          ..write(')'))
        .toString();
  }
}

class $SyncQueueTable extends SyncQueue
    with TableInfo<$SyncQueueTable, SyncQueueData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SyncQueueTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _operationIdMeta = const VerificationMeta(
    'operationId',
  );
  @override
  late final GeneratedColumn<String> operationId = GeneratedColumn<String>(
    'operation_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways('UNIQUE'),
  );
  static const VerificationMeta _resourceTypeMeta = const VerificationMeta(
    'resourceType',
  );
  @override
  late final GeneratedColumn<String> resourceType = GeneratedColumn<String>(
    'resource_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _resourceIdMeta = const VerificationMeta(
    'resourceId',
  );
  @override
  late final GeneratedColumn<String> resourceId = GeneratedColumn<String>(
    'resource_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _operationMeta = const VerificationMeta(
    'operation',
  );
  @override
  late final GeneratedColumn<String> operation = GeneratedColumn<String>(
    'operation',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _resourceVersionMeta = const VerificationMeta(
    'resourceVersion',
  );
  @override
  late final GeneratedColumn<int> resourceVersion = GeneratedColumn<int>(
    'resource_version',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _payloadMeta = const VerificationMeta(
    'payload',
  );
  @override
  late final GeneratedColumn<String> payload = GeneratedColumn<String>(
    'payload',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  static const VerificationMeta _retryCountMeta = const VerificationMeta(
    'retryCount',
  );
  @override
  late final GeneratedColumn<int> retryCount = GeneratedColumn<int>(
    'retry_count',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _lastAttemptAtMeta = const VerificationMeta(
    'lastAttemptAt',
  );
  @override
  late final GeneratedColumn<DateTime> lastAttemptAt =
      GeneratedColumn<DateTime>(
        'last_attempt_at',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  @override
  late final GeneratedColumnWithTypeConverter<SyncQueueStatus, int> status =
      GeneratedColumn<int>(
        'status',
        aliasedName,
        false,
        type: DriftSqlType.int,
        requiredDuringInsert: false,
        defaultValue: const Constant(0),
      ).withConverter<SyncQueueStatus>($SyncQueueTable.$converterstatus);
  @override
  List<GeneratedColumn> get $columns => [
    id,
    operationId,
    resourceType,
    resourceId,
    operation,
    resourceVersion,
    payload,
    createdAt,
    retryCount,
    lastAttemptAt,
    status,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sync_queue';
  @override
  VerificationContext validateIntegrity(
    Insertable<SyncQueueData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('operation_id')) {
      context.handle(
        _operationIdMeta,
        operationId.isAcceptableOrUnknown(
          data['operation_id']!,
          _operationIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_operationIdMeta);
    }
    if (data.containsKey('resource_type')) {
      context.handle(
        _resourceTypeMeta,
        resourceType.isAcceptableOrUnknown(
          data['resource_type']!,
          _resourceTypeMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_resourceTypeMeta);
    }
    if (data.containsKey('resource_id')) {
      context.handle(
        _resourceIdMeta,
        resourceId.isAcceptableOrUnknown(data['resource_id']!, _resourceIdMeta),
      );
    } else if (isInserting) {
      context.missing(_resourceIdMeta);
    }
    if (data.containsKey('operation')) {
      context.handle(
        _operationMeta,
        operation.isAcceptableOrUnknown(data['operation']!, _operationMeta),
      );
    } else if (isInserting) {
      context.missing(_operationMeta);
    }
    if (data.containsKey('resource_version')) {
      context.handle(
        _resourceVersionMeta,
        resourceVersion.isAcceptableOrUnknown(
          data['resource_version']!,
          _resourceVersionMeta,
        ),
      );
    }
    if (data.containsKey('payload')) {
      context.handle(
        _payloadMeta,
        payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta),
      );
    } else if (isInserting) {
      context.missing(_payloadMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    if (data.containsKey('retry_count')) {
      context.handle(
        _retryCountMeta,
        retryCount.isAcceptableOrUnknown(data['retry_count']!, _retryCountMeta),
      );
    }
    if (data.containsKey('last_attempt_at')) {
      context.handle(
        _lastAttemptAtMeta,
        lastAttemptAt.isAcceptableOrUnknown(
          data['last_attempt_at']!,
          _lastAttemptAtMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  SyncQueueData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SyncQueueData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      operationId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}operation_id'],
      )!,
      resourceType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}resource_type'],
      )!,
      resourceId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}resource_id'],
      )!,
      operation: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}operation'],
      )!,
      resourceVersion: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}resource_version'],
      )!,
      payload: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}payload'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      retryCount: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}retry_count'],
      )!,
      lastAttemptAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_attempt_at'],
      ),
      status: $SyncQueueTable.$converterstatus.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.int,
          data['${effectivePrefix}status'],
        )!,
      ),
    );
  }

  @override
  $SyncQueueTable createAlias(String alias) {
    return $SyncQueueTable(attachedDatabase, alias);
  }

  static JsonTypeConverter2<SyncQueueStatus, int, int> $converterstatus =
      const EnumIndexConverter<SyncQueueStatus>(SyncQueueStatus.values);
}

class SyncQueueData extends DataClass implements Insertable<SyncQueueData> {
  final String id;

  /// ULID — time-sortable, globally unique, used for server-side idempotency.
  final String operationId;
  final String resourceType;
  final String resourceId;
  final String operation;

  /// The last resource version the client observed before making this change.
  /// Server rejects with 409 if its current version != this value.
  final int resourceVersion;
  final String payload;
  final DateTime createdAt;
  final int retryCount;
  final DateTime? lastAttemptAt;
  final SyncQueueStatus status;
  const SyncQueueData({
    required this.id,
    required this.operationId,
    required this.resourceType,
    required this.resourceId,
    required this.operation,
    required this.resourceVersion,
    required this.payload,
    required this.createdAt,
    required this.retryCount,
    this.lastAttemptAt,
    required this.status,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['operation_id'] = Variable<String>(operationId);
    map['resource_type'] = Variable<String>(resourceType);
    map['resource_id'] = Variable<String>(resourceId);
    map['operation'] = Variable<String>(operation);
    map['resource_version'] = Variable<int>(resourceVersion);
    map['payload'] = Variable<String>(payload);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['retry_count'] = Variable<int>(retryCount);
    if (!nullToAbsent || lastAttemptAt != null) {
      map['last_attempt_at'] = Variable<DateTime>(lastAttemptAt);
    }
    {
      map['status'] = Variable<int>(
        $SyncQueueTable.$converterstatus.toSql(status),
      );
    }
    return map;
  }

  SyncQueueCompanion toCompanion(bool nullToAbsent) {
    return SyncQueueCompanion(
      id: Value(id),
      operationId: Value(operationId),
      resourceType: Value(resourceType),
      resourceId: Value(resourceId),
      operation: Value(operation),
      resourceVersion: Value(resourceVersion),
      payload: Value(payload),
      createdAt: Value(createdAt),
      retryCount: Value(retryCount),
      lastAttemptAt: lastAttemptAt == null && nullToAbsent
          ? const Value.absent()
          : Value(lastAttemptAt),
      status: Value(status),
    );
  }

  factory SyncQueueData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SyncQueueData(
      id: serializer.fromJson<String>(json['id']),
      operationId: serializer.fromJson<String>(json['operationId']),
      resourceType: serializer.fromJson<String>(json['resourceType']),
      resourceId: serializer.fromJson<String>(json['resourceId']),
      operation: serializer.fromJson<String>(json['operation']),
      resourceVersion: serializer.fromJson<int>(json['resourceVersion']),
      payload: serializer.fromJson<String>(json['payload']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      retryCount: serializer.fromJson<int>(json['retryCount']),
      lastAttemptAt: serializer.fromJson<DateTime?>(json['lastAttemptAt']),
      status: $SyncQueueTable.$converterstatus.fromJson(
        serializer.fromJson<int>(json['status']),
      ),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'operationId': serializer.toJson<String>(operationId),
      'resourceType': serializer.toJson<String>(resourceType),
      'resourceId': serializer.toJson<String>(resourceId),
      'operation': serializer.toJson<String>(operation),
      'resourceVersion': serializer.toJson<int>(resourceVersion),
      'payload': serializer.toJson<String>(payload),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'retryCount': serializer.toJson<int>(retryCount),
      'lastAttemptAt': serializer.toJson<DateTime?>(lastAttemptAt),
      'status': serializer.toJson<int>(
        $SyncQueueTable.$converterstatus.toJson(status),
      ),
    };
  }

  SyncQueueData copyWith({
    String? id,
    String? operationId,
    String? resourceType,
    String? resourceId,
    String? operation,
    int? resourceVersion,
    String? payload,
    DateTime? createdAt,
    int? retryCount,
    Value<DateTime?> lastAttemptAt = const Value.absent(),
    SyncQueueStatus? status,
  }) => SyncQueueData(
    id: id ?? this.id,
    operationId: operationId ?? this.operationId,
    resourceType: resourceType ?? this.resourceType,
    resourceId: resourceId ?? this.resourceId,
    operation: operation ?? this.operation,
    resourceVersion: resourceVersion ?? this.resourceVersion,
    payload: payload ?? this.payload,
    createdAt: createdAt ?? this.createdAt,
    retryCount: retryCount ?? this.retryCount,
    lastAttemptAt: lastAttemptAt.present
        ? lastAttemptAt.value
        : this.lastAttemptAt,
    status: status ?? this.status,
  );
  SyncQueueData copyWithCompanion(SyncQueueCompanion data) {
    return SyncQueueData(
      id: data.id.present ? data.id.value : this.id,
      operationId: data.operationId.present
          ? data.operationId.value
          : this.operationId,
      resourceType: data.resourceType.present
          ? data.resourceType.value
          : this.resourceType,
      resourceId: data.resourceId.present
          ? data.resourceId.value
          : this.resourceId,
      operation: data.operation.present ? data.operation.value : this.operation,
      resourceVersion: data.resourceVersion.present
          ? data.resourceVersion.value
          : this.resourceVersion,
      payload: data.payload.present ? data.payload.value : this.payload,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      retryCount: data.retryCount.present
          ? data.retryCount.value
          : this.retryCount,
      lastAttemptAt: data.lastAttemptAt.present
          ? data.lastAttemptAt.value
          : this.lastAttemptAt,
      status: data.status.present ? data.status.value : this.status,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SyncQueueData(')
          ..write('id: $id, ')
          ..write('operationId: $operationId, ')
          ..write('resourceType: $resourceType, ')
          ..write('resourceId: $resourceId, ')
          ..write('operation: $operation, ')
          ..write('resourceVersion: $resourceVersion, ')
          ..write('payload: $payload, ')
          ..write('createdAt: $createdAt, ')
          ..write('retryCount: $retryCount, ')
          ..write('lastAttemptAt: $lastAttemptAt, ')
          ..write('status: $status')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    operationId,
    resourceType,
    resourceId,
    operation,
    resourceVersion,
    payload,
    createdAt,
    retryCount,
    lastAttemptAt,
    status,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SyncQueueData &&
          other.id == this.id &&
          other.operationId == this.operationId &&
          other.resourceType == this.resourceType &&
          other.resourceId == this.resourceId &&
          other.operation == this.operation &&
          other.resourceVersion == this.resourceVersion &&
          other.payload == this.payload &&
          other.createdAt == this.createdAt &&
          other.retryCount == this.retryCount &&
          other.lastAttemptAt == this.lastAttemptAt &&
          other.status == this.status);
}

class SyncQueueCompanion extends UpdateCompanion<SyncQueueData> {
  final Value<String> id;
  final Value<String> operationId;
  final Value<String> resourceType;
  final Value<String> resourceId;
  final Value<String> operation;
  final Value<int> resourceVersion;
  final Value<String> payload;
  final Value<DateTime> createdAt;
  final Value<int> retryCount;
  final Value<DateTime?> lastAttemptAt;
  final Value<SyncQueueStatus> status;
  final Value<int> rowid;
  const SyncQueueCompanion({
    this.id = const Value.absent(),
    this.operationId = const Value.absent(),
    this.resourceType = const Value.absent(),
    this.resourceId = const Value.absent(),
    this.operation = const Value.absent(),
    this.resourceVersion = const Value.absent(),
    this.payload = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.retryCount = const Value.absent(),
    this.lastAttemptAt = const Value.absent(),
    this.status = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  SyncQueueCompanion.insert({
    required String id,
    required String operationId,
    required String resourceType,
    required String resourceId,
    required String operation,
    this.resourceVersion = const Value.absent(),
    required String payload,
    this.createdAt = const Value.absent(),
    this.retryCount = const Value.absent(),
    this.lastAttemptAt = const Value.absent(),
    this.status = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       operationId = Value(operationId),
       resourceType = Value(resourceType),
       resourceId = Value(resourceId),
       operation = Value(operation),
       payload = Value(payload);
  static Insertable<SyncQueueData> custom({
    Expression<String>? id,
    Expression<String>? operationId,
    Expression<String>? resourceType,
    Expression<String>? resourceId,
    Expression<String>? operation,
    Expression<int>? resourceVersion,
    Expression<String>? payload,
    Expression<DateTime>? createdAt,
    Expression<int>? retryCount,
    Expression<DateTime>? lastAttemptAt,
    Expression<int>? status,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (operationId != null) 'operation_id': operationId,
      if (resourceType != null) 'resource_type': resourceType,
      if (resourceId != null) 'resource_id': resourceId,
      if (operation != null) 'operation': operation,
      if (resourceVersion != null) 'resource_version': resourceVersion,
      if (payload != null) 'payload': payload,
      if (createdAt != null) 'created_at': createdAt,
      if (retryCount != null) 'retry_count': retryCount,
      if (lastAttemptAt != null) 'last_attempt_at': lastAttemptAt,
      if (status != null) 'status': status,
      if (rowid != null) 'rowid': rowid,
    });
  }

  SyncQueueCompanion copyWith({
    Value<String>? id,
    Value<String>? operationId,
    Value<String>? resourceType,
    Value<String>? resourceId,
    Value<String>? operation,
    Value<int>? resourceVersion,
    Value<String>? payload,
    Value<DateTime>? createdAt,
    Value<int>? retryCount,
    Value<DateTime?>? lastAttemptAt,
    Value<SyncQueueStatus>? status,
    Value<int>? rowid,
  }) {
    return SyncQueueCompanion(
      id: id ?? this.id,
      operationId: operationId ?? this.operationId,
      resourceType: resourceType ?? this.resourceType,
      resourceId: resourceId ?? this.resourceId,
      operation: operation ?? this.operation,
      resourceVersion: resourceVersion ?? this.resourceVersion,
      payload: payload ?? this.payload,
      createdAt: createdAt ?? this.createdAt,
      retryCount: retryCount ?? this.retryCount,
      lastAttemptAt: lastAttemptAt ?? this.lastAttemptAt,
      status: status ?? this.status,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (operationId.present) {
      map['operation_id'] = Variable<String>(operationId.value);
    }
    if (resourceType.present) {
      map['resource_type'] = Variable<String>(resourceType.value);
    }
    if (resourceId.present) {
      map['resource_id'] = Variable<String>(resourceId.value);
    }
    if (operation.present) {
      map['operation'] = Variable<String>(operation.value);
    }
    if (resourceVersion.present) {
      map['resource_version'] = Variable<int>(resourceVersion.value);
    }
    if (payload.present) {
      map['payload'] = Variable<String>(payload.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (retryCount.present) {
      map['retry_count'] = Variable<int>(retryCount.value);
    }
    if (lastAttemptAt.present) {
      map['last_attempt_at'] = Variable<DateTime>(lastAttemptAt.value);
    }
    if (status.present) {
      map['status'] = Variable<int>(
        $SyncQueueTable.$converterstatus.toSql(status.value),
      );
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SyncQueueCompanion(')
          ..write('id: $id, ')
          ..write('operationId: $operationId, ')
          ..write('resourceType: $resourceType, ')
          ..write('resourceId: $resourceId, ')
          ..write('operation: $operation, ')
          ..write('resourceVersion: $resourceVersion, ')
          ..write('payload: $payload, ')
          ..write('createdAt: $createdAt, ')
          ..write('retryCount: $retryCount, ')
          ..write('lastAttemptAt: $lastAttemptAt, ')
          ..write('status: $status, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $ProjectsTable extends Projects with TableInfo<$ProjectsTable, Project> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ProjectsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _authorNameMeta = const VerificationMeta(
    'authorName',
  );
  @override
  late final GeneratedColumn<String> authorName = GeneratedColumn<String>(
    'author_name',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _genreMeta = const VerificationMeta('genre');
  @override
  late final GeneratedColumn<String> genre = GeneratedColumn<String>(
    'genre',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _themeColorMeta = const VerificationMeta(
    'themeColor',
  );
  @override
  late final GeneratedColumn<String> themeColor = GeneratedColumn<String>(
    'theme_color',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _coverImageMeta = const VerificationMeta(
    'coverImage',
  );
  @override
  late final GeneratedColumn<String> coverImage = GeneratedColumn<String>(
    'cover_image',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _targetWordCountMeta = const VerificationMeta(
    'targetWordCount',
  );
  @override
  late final GeneratedColumn<int> targetWordCount = GeneratedColumn<int>(
    'target_word_count',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _accentColorMeta = const VerificationMeta(
    'accentColor',
  );
  @override
  late final GeneratedColumn<String> accentColor = GeneratedColumn<String>(
    'accent_color',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _fontPairMeta = const VerificationMeta(
    'fontPair',
  );
  @override
  late final GeneratedColumn<String> fontPair = GeneratedColumn<String>(
    'font_pair',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _bookSeriesMeta = const VerificationMeta(
    'bookSeries',
  );
  @override
  late final GeneratedColumn<String> bookSeries = GeneratedColumn<String>(
    'book_series',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _volumeMeta = const VerificationMeta('volume');
  @override
  late final GeneratedColumn<int> volume = GeneratedColumn<int>(
    'volume',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _publisherMeta = const VerificationMeta(
    'publisher',
  );
  @override
  late final GeneratedColumn<String> publisher = GeneratedColumn<String>(
    'publisher',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _copyrightMeta = const VerificationMeta(
    'copyright',
  );
  @override
  late final GeneratedColumn<String> copyright = GeneratedColumn<String>(
    'copyright',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _languageMeta = const VerificationMeta(
    'language',
  );
  @override
  late final GeneratedColumn<String> language = GeneratedColumn<String>(
    'language',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _versionMeta = const VerificationMeta(
    'version',
  );
  @override
  late final GeneratedColumn<int> version = GeneratedColumn<int>(
    'version',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    name,
    authorName,
    genre,
    themeColor,
    coverImage,
    targetWordCount,
    accentColor,
    fontPair,
    bookSeries,
    volume,
    publisher,
    copyright,
    language,
    version,
    createdAt,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'projects';
  @override
  VerificationContext validateIntegrity(
    Insertable<Project> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('author_name')) {
      context.handle(
        _authorNameMeta,
        authorName.isAcceptableOrUnknown(data['author_name']!, _authorNameMeta),
      );
    }
    if (data.containsKey('genre')) {
      context.handle(
        _genreMeta,
        genre.isAcceptableOrUnknown(data['genre']!, _genreMeta),
      );
    }
    if (data.containsKey('theme_color')) {
      context.handle(
        _themeColorMeta,
        themeColor.isAcceptableOrUnknown(data['theme_color']!, _themeColorMeta),
      );
    }
    if (data.containsKey('cover_image')) {
      context.handle(
        _coverImageMeta,
        coverImage.isAcceptableOrUnknown(data['cover_image']!, _coverImageMeta),
      );
    }
    if (data.containsKey('target_word_count')) {
      context.handle(
        _targetWordCountMeta,
        targetWordCount.isAcceptableOrUnknown(
          data['target_word_count']!,
          _targetWordCountMeta,
        ),
      );
    }
    if (data.containsKey('accent_color')) {
      context.handle(
        _accentColorMeta,
        accentColor.isAcceptableOrUnknown(
          data['accent_color']!,
          _accentColorMeta,
        ),
      );
    }
    if (data.containsKey('font_pair')) {
      context.handle(
        _fontPairMeta,
        fontPair.isAcceptableOrUnknown(data['font_pair']!, _fontPairMeta),
      );
    }
    if (data.containsKey('book_series')) {
      context.handle(
        _bookSeriesMeta,
        bookSeries.isAcceptableOrUnknown(data['book_series']!, _bookSeriesMeta),
      );
    }
    if (data.containsKey('volume')) {
      context.handle(
        _volumeMeta,
        volume.isAcceptableOrUnknown(data['volume']!, _volumeMeta),
      );
    }
    if (data.containsKey('publisher')) {
      context.handle(
        _publisherMeta,
        publisher.isAcceptableOrUnknown(data['publisher']!, _publisherMeta),
      );
    }
    if (data.containsKey('copyright')) {
      context.handle(
        _copyrightMeta,
        copyright.isAcceptableOrUnknown(data['copyright']!, _copyrightMeta),
      );
    }
    if (data.containsKey('language')) {
      context.handle(
        _languageMeta,
        language.isAcceptableOrUnknown(data['language']!, _languageMeta),
      );
    }
    if (data.containsKey('version')) {
      context.handle(
        _versionMeta,
        version.isAcceptableOrUnknown(data['version']!, _versionMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Project map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Project(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      authorName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}author_name'],
      ),
      genre: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}genre'],
      ),
      themeColor: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}theme_color'],
      ),
      coverImage: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}cover_image'],
      ),
      targetWordCount: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}target_word_count'],
      ),
      accentColor: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}accent_color'],
      ),
      fontPair: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}font_pair'],
      ),
      bookSeries: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}book_series'],
      ),
      volume: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}volume'],
      ),
      publisher: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}publisher'],
      ),
      copyright: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}copyright'],
      ),
      language: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}language'],
      ),
      version: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}version'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $ProjectsTable createAlias(String alias) {
    return $ProjectsTable(attachedDatabase, alias);
  }
}

class Project extends DataClass implements Insertable<Project> {
  final String id;
  final String name;
  final String? authorName;
  final String? genre;
  final String? themeColor;
  final String? coverImage;
  final int? targetWordCount;
  final String? accentColor;
  final String? fontPair;
  final String? bookSeries;
  final int? volume;
  final String? publisher;
  final String? copyright;
  final String? language;
  final int version;
  final DateTime createdAt;
  final DateTime updatedAt;
  const Project({
    required this.id,
    required this.name,
    this.authorName,
    this.genre,
    this.themeColor,
    this.coverImage,
    this.targetWordCount,
    this.accentColor,
    this.fontPair,
    this.bookSeries,
    this.volume,
    this.publisher,
    this.copyright,
    this.language,
    required this.version,
    required this.createdAt,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['name'] = Variable<String>(name);
    if (!nullToAbsent || authorName != null) {
      map['author_name'] = Variable<String>(authorName);
    }
    if (!nullToAbsent || genre != null) {
      map['genre'] = Variable<String>(genre);
    }
    if (!nullToAbsent || themeColor != null) {
      map['theme_color'] = Variable<String>(themeColor);
    }
    if (!nullToAbsent || coverImage != null) {
      map['cover_image'] = Variable<String>(coverImage);
    }
    if (!nullToAbsent || targetWordCount != null) {
      map['target_word_count'] = Variable<int>(targetWordCount);
    }
    if (!nullToAbsent || accentColor != null) {
      map['accent_color'] = Variable<String>(accentColor);
    }
    if (!nullToAbsent || fontPair != null) {
      map['font_pair'] = Variable<String>(fontPair);
    }
    if (!nullToAbsent || bookSeries != null) {
      map['book_series'] = Variable<String>(bookSeries);
    }
    if (!nullToAbsent || volume != null) {
      map['volume'] = Variable<int>(volume);
    }
    if (!nullToAbsent || publisher != null) {
      map['publisher'] = Variable<String>(publisher);
    }
    if (!nullToAbsent || copyright != null) {
      map['copyright'] = Variable<String>(copyright);
    }
    if (!nullToAbsent || language != null) {
      map['language'] = Variable<String>(language);
    }
    map['version'] = Variable<int>(version);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  ProjectsCompanion toCompanion(bool nullToAbsent) {
    return ProjectsCompanion(
      id: Value(id),
      name: Value(name),
      authorName: authorName == null && nullToAbsent
          ? const Value.absent()
          : Value(authorName),
      genre: genre == null && nullToAbsent
          ? const Value.absent()
          : Value(genre),
      themeColor: themeColor == null && nullToAbsent
          ? const Value.absent()
          : Value(themeColor),
      coverImage: coverImage == null && nullToAbsent
          ? const Value.absent()
          : Value(coverImage),
      targetWordCount: targetWordCount == null && nullToAbsent
          ? const Value.absent()
          : Value(targetWordCount),
      accentColor: accentColor == null && nullToAbsent
          ? const Value.absent()
          : Value(accentColor),
      fontPair: fontPair == null && nullToAbsent
          ? const Value.absent()
          : Value(fontPair),
      bookSeries: bookSeries == null && nullToAbsent
          ? const Value.absent()
          : Value(bookSeries),
      volume: volume == null && nullToAbsent
          ? const Value.absent()
          : Value(volume),
      publisher: publisher == null && nullToAbsent
          ? const Value.absent()
          : Value(publisher),
      copyright: copyright == null && nullToAbsent
          ? const Value.absent()
          : Value(copyright),
      language: language == null && nullToAbsent
          ? const Value.absent()
          : Value(language),
      version: Value(version),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
    );
  }

  factory Project.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Project(
      id: serializer.fromJson<String>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      authorName: serializer.fromJson<String?>(json['authorName']),
      genre: serializer.fromJson<String?>(json['genre']),
      themeColor: serializer.fromJson<String?>(json['themeColor']),
      coverImage: serializer.fromJson<String?>(json['coverImage']),
      targetWordCount: serializer.fromJson<int?>(json['targetWordCount']),
      accentColor: serializer.fromJson<String?>(json['accentColor']),
      fontPair: serializer.fromJson<String?>(json['fontPair']),
      bookSeries: serializer.fromJson<String?>(json['bookSeries']),
      volume: serializer.fromJson<int?>(json['volume']),
      publisher: serializer.fromJson<String?>(json['publisher']),
      copyright: serializer.fromJson<String?>(json['copyright']),
      language: serializer.fromJson<String?>(json['language']),
      version: serializer.fromJson<int>(json['version']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'name': serializer.toJson<String>(name),
      'authorName': serializer.toJson<String?>(authorName),
      'genre': serializer.toJson<String?>(genre),
      'themeColor': serializer.toJson<String?>(themeColor),
      'coverImage': serializer.toJson<String?>(coverImage),
      'targetWordCount': serializer.toJson<int?>(targetWordCount),
      'accentColor': serializer.toJson<String?>(accentColor),
      'fontPair': serializer.toJson<String?>(fontPair),
      'bookSeries': serializer.toJson<String?>(bookSeries),
      'volume': serializer.toJson<int?>(volume),
      'publisher': serializer.toJson<String?>(publisher),
      'copyright': serializer.toJson<String?>(copyright),
      'language': serializer.toJson<String?>(language),
      'version': serializer.toJson<int>(version),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  Project copyWith({
    String? id,
    String? name,
    Value<String?> authorName = const Value.absent(),
    Value<String?> genre = const Value.absent(),
    Value<String?> themeColor = const Value.absent(),
    Value<String?> coverImage = const Value.absent(),
    Value<int?> targetWordCount = const Value.absent(),
    Value<String?> accentColor = const Value.absent(),
    Value<String?> fontPair = const Value.absent(),
    Value<String?> bookSeries = const Value.absent(),
    Value<int?> volume = const Value.absent(),
    Value<String?> publisher = const Value.absent(),
    Value<String?> copyright = const Value.absent(),
    Value<String?> language = const Value.absent(),
    int? version,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => Project(
    id: id ?? this.id,
    name: name ?? this.name,
    authorName: authorName.present ? authorName.value : this.authorName,
    genre: genre.present ? genre.value : this.genre,
    themeColor: themeColor.present ? themeColor.value : this.themeColor,
    coverImage: coverImage.present ? coverImage.value : this.coverImage,
    targetWordCount: targetWordCount.present
        ? targetWordCount.value
        : this.targetWordCount,
    accentColor: accentColor.present ? accentColor.value : this.accentColor,
    fontPair: fontPair.present ? fontPair.value : this.fontPair,
    bookSeries: bookSeries.present ? bookSeries.value : this.bookSeries,
    volume: volume.present ? volume.value : this.volume,
    publisher: publisher.present ? publisher.value : this.publisher,
    copyright: copyright.present ? copyright.value : this.copyright,
    language: language.present ? language.value : this.language,
    version: version ?? this.version,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  Project copyWithCompanion(ProjectsCompanion data) {
    return Project(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      authorName: data.authorName.present
          ? data.authorName.value
          : this.authorName,
      genre: data.genre.present ? data.genre.value : this.genre,
      themeColor: data.themeColor.present
          ? data.themeColor.value
          : this.themeColor,
      coverImage: data.coverImage.present
          ? data.coverImage.value
          : this.coverImage,
      targetWordCount: data.targetWordCount.present
          ? data.targetWordCount.value
          : this.targetWordCount,
      accentColor: data.accentColor.present
          ? data.accentColor.value
          : this.accentColor,
      fontPair: data.fontPair.present ? data.fontPair.value : this.fontPair,
      bookSeries: data.bookSeries.present
          ? data.bookSeries.value
          : this.bookSeries,
      volume: data.volume.present ? data.volume.value : this.volume,
      publisher: data.publisher.present ? data.publisher.value : this.publisher,
      copyright: data.copyright.present ? data.copyright.value : this.copyright,
      language: data.language.present ? data.language.value : this.language,
      version: data.version.present ? data.version.value : this.version,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Project(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('authorName: $authorName, ')
          ..write('genre: $genre, ')
          ..write('themeColor: $themeColor, ')
          ..write('coverImage: $coverImage, ')
          ..write('targetWordCount: $targetWordCount, ')
          ..write('accentColor: $accentColor, ')
          ..write('fontPair: $fontPair, ')
          ..write('bookSeries: $bookSeries, ')
          ..write('volume: $volume, ')
          ..write('publisher: $publisher, ')
          ..write('copyright: $copyright, ')
          ..write('language: $language, ')
          ..write('version: $version, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    name,
    authorName,
    genre,
    themeColor,
    coverImage,
    targetWordCount,
    accentColor,
    fontPair,
    bookSeries,
    volume,
    publisher,
    copyright,
    language,
    version,
    createdAt,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Project &&
          other.id == this.id &&
          other.name == this.name &&
          other.authorName == this.authorName &&
          other.genre == this.genre &&
          other.themeColor == this.themeColor &&
          other.coverImage == this.coverImage &&
          other.targetWordCount == this.targetWordCount &&
          other.accentColor == this.accentColor &&
          other.fontPair == this.fontPair &&
          other.bookSeries == this.bookSeries &&
          other.volume == this.volume &&
          other.publisher == this.publisher &&
          other.copyright == this.copyright &&
          other.language == this.language &&
          other.version == this.version &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt);
}

class ProjectsCompanion extends UpdateCompanion<Project> {
  final Value<String> id;
  final Value<String> name;
  final Value<String?> authorName;
  final Value<String?> genre;
  final Value<String?> themeColor;
  final Value<String?> coverImage;
  final Value<int?> targetWordCount;
  final Value<String?> accentColor;
  final Value<String?> fontPair;
  final Value<String?> bookSeries;
  final Value<int?> volume;
  final Value<String?> publisher;
  final Value<String?> copyright;
  final Value<String?> language;
  final Value<int> version;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const ProjectsCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.authorName = const Value.absent(),
    this.genre = const Value.absent(),
    this.themeColor = const Value.absent(),
    this.coverImage = const Value.absent(),
    this.targetWordCount = const Value.absent(),
    this.accentColor = const Value.absent(),
    this.fontPair = const Value.absent(),
    this.bookSeries = const Value.absent(),
    this.volume = const Value.absent(),
    this.publisher = const Value.absent(),
    this.copyright = const Value.absent(),
    this.language = const Value.absent(),
    this.version = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  ProjectsCompanion.insert({
    required String id,
    required String name,
    this.authorName = const Value.absent(),
    this.genre = const Value.absent(),
    this.themeColor = const Value.absent(),
    this.coverImage = const Value.absent(),
    this.targetWordCount = const Value.absent(),
    this.accentColor = const Value.absent(),
    this.fontPair = const Value.absent(),
    this.bookSeries = const Value.absent(),
    this.volume = const Value.absent(),
    this.publisher = const Value.absent(),
    this.copyright = const Value.absent(),
    this.language = const Value.absent(),
    this.version = const Value.absent(),
    required DateTime createdAt,
    required DateTime updatedAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       name = Value(name),
       createdAt = Value(createdAt),
       updatedAt = Value(updatedAt);
  static Insertable<Project> custom({
    Expression<String>? id,
    Expression<String>? name,
    Expression<String>? authorName,
    Expression<String>? genre,
    Expression<String>? themeColor,
    Expression<String>? coverImage,
    Expression<int>? targetWordCount,
    Expression<String>? accentColor,
    Expression<String>? fontPair,
    Expression<String>? bookSeries,
    Expression<int>? volume,
    Expression<String>? publisher,
    Expression<String>? copyright,
    Expression<String>? language,
    Expression<int>? version,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (authorName != null) 'author_name': authorName,
      if (genre != null) 'genre': genre,
      if (themeColor != null) 'theme_color': themeColor,
      if (coverImage != null) 'cover_image': coverImage,
      if (targetWordCount != null) 'target_word_count': targetWordCount,
      if (accentColor != null) 'accent_color': accentColor,
      if (fontPair != null) 'font_pair': fontPair,
      if (bookSeries != null) 'book_series': bookSeries,
      if (volume != null) 'volume': volume,
      if (publisher != null) 'publisher': publisher,
      if (copyright != null) 'copyright': copyright,
      if (language != null) 'language': language,
      if (version != null) 'version': version,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  ProjectsCompanion copyWith({
    Value<String>? id,
    Value<String>? name,
    Value<String?>? authorName,
    Value<String?>? genre,
    Value<String?>? themeColor,
    Value<String?>? coverImage,
    Value<int?>? targetWordCount,
    Value<String?>? accentColor,
    Value<String?>? fontPair,
    Value<String?>? bookSeries,
    Value<int?>? volume,
    Value<String?>? publisher,
    Value<String?>? copyright,
    Value<String?>? language,
    Value<int>? version,
    Value<DateTime>? createdAt,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return ProjectsCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      authorName: authorName ?? this.authorName,
      genre: genre ?? this.genre,
      themeColor: themeColor ?? this.themeColor,
      coverImage: coverImage ?? this.coverImage,
      targetWordCount: targetWordCount ?? this.targetWordCount,
      accentColor: accentColor ?? this.accentColor,
      fontPair: fontPair ?? this.fontPair,
      bookSeries: bookSeries ?? this.bookSeries,
      volume: volume ?? this.volume,
      publisher: publisher ?? this.publisher,
      copyright: copyright ?? this.copyright,
      language: language ?? this.language,
      version: version ?? this.version,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (authorName.present) {
      map['author_name'] = Variable<String>(authorName.value);
    }
    if (genre.present) {
      map['genre'] = Variable<String>(genre.value);
    }
    if (themeColor.present) {
      map['theme_color'] = Variable<String>(themeColor.value);
    }
    if (coverImage.present) {
      map['cover_image'] = Variable<String>(coverImage.value);
    }
    if (targetWordCount.present) {
      map['target_word_count'] = Variable<int>(targetWordCount.value);
    }
    if (accentColor.present) {
      map['accent_color'] = Variable<String>(accentColor.value);
    }
    if (fontPair.present) {
      map['font_pair'] = Variable<String>(fontPair.value);
    }
    if (bookSeries.present) {
      map['book_series'] = Variable<String>(bookSeries.value);
    }
    if (volume.present) {
      map['volume'] = Variable<int>(volume.value);
    }
    if (publisher.present) {
      map['publisher'] = Variable<String>(publisher.value);
    }
    if (copyright.present) {
      map['copyright'] = Variable<String>(copyright.value);
    }
    if (language.present) {
      map['language'] = Variable<String>(language.value);
    }
    if (version.present) {
      map['version'] = Variable<int>(version.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ProjectsCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('authorName: $authorName, ')
          ..write('genre: $genre, ')
          ..write('themeColor: $themeColor, ')
          ..write('coverImage: $coverImage, ')
          ..write('targetWordCount: $targetWordCount, ')
          ..write('accentColor: $accentColor, ')
          ..write('fontPair: $fontPair, ')
          ..write('bookSeries: $bookSeries, ')
          ..write('volume: $volume, ')
          ..write('publisher: $publisher, ')
          ..write('copyright: $copyright, ')
          ..write('language: $language, ')
          ..write('version: $version, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $StoryEntitiesTable extends StoryEntities
    with TableInfo<$StoryEntitiesTable, StoryEntity> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $StoryEntitiesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _projectIdMeta = const VerificationMeta(
    'projectId',
  );
  @override
  late final GeneratedColumn<String> projectId = GeneratedColumn<String>(
    'project_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES projects (id)',
    ),
  );
  static const VerificationMeta _typeMeta = const VerificationMeta('type');
  @override
  late final GeneratedColumn<String> type = GeneratedColumn<String>(
    'type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _templateIdMeta = const VerificationMeta(
    'templateId',
  );
  @override
  late final GeneratedColumn<String> templateId = GeneratedColumn<String>(
    'template_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
    'title',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _descriptionMeta = const VerificationMeta(
    'description',
  );
  @override
  late final GeneratedColumn<String> description = GeneratedColumn<String>(
    'description',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _imageSourceMeta = const VerificationMeta(
    'imageSource',
  );
  @override
  late final GeneratedColumn<String> imageSource = GeneratedColumn<String>(
    'image_source',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _imagePathMeta = const VerificationMeta(
    'imagePath',
  );
  @override
  late final GeneratedColumn<String> imagePath = GeneratedColumn<String>(
    'image_path',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _thumbnailPathMeta = const VerificationMeta(
    'thumbnailPath',
  );
  @override
  late final GeneratedColumn<String> thumbnailPath = GeneratedColumn<String>(
    'thumbnail_path',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _metadataJsonMeta = const VerificationMeta(
    'metadataJson',
  );
  @override
  late final GeneratedColumn<String> metadataJson = GeneratedColumn<String>(
    'metadata_json',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _aiSummaryMeta = const VerificationMeta(
    'aiSummary',
  );
  @override
  late final GeneratedColumn<String> aiSummary = GeneratedColumn<String>(
    'ai_summary',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _embeddingVersionMeta = const VerificationMeta(
    'embeddingVersion',
  );
  @override
  late final GeneratedColumn<String> embeddingVersion = GeneratedColumn<String>(
    'embedding_version',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _connectionCountMeta = const VerificationMeta(
    'connectionCount',
  );
  @override
  late final GeneratedColumn<int> connectionCount = GeneratedColumn<int>(
    'connection_count',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _sceneAppearancesMeta = const VerificationMeta(
    'sceneAppearances',
  );
  @override
  late final GeneratedColumn<int> sceneAppearances = GeneratedColumn<int>(
    'scene_appearances',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _importanceScoreMeta = const VerificationMeta(
    'importanceScore',
  );
  @override
  late final GeneratedColumn<int> importanceScore = GeneratedColumn<int>(
    'importance_score',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(50),
  );
  static const VerificationMeta _versionMeta = const VerificationMeta(
    'version',
  );
  @override
  late final GeneratedColumn<int> version = GeneratedColumn<int>(
    'version',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _updatedByMeta = const VerificationMeta(
    'updatedBy',
  );
  @override
  late final GeneratedColumn<String> updatedBy = GeneratedColumn<String>(
    'updated_by',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    projectId,
    type,
    templateId,
    title,
    description,
    imageSource,
    imagePath,
    thumbnailPath,
    metadataJson,
    aiSummary,
    embeddingVersion,
    connectionCount,
    sceneAppearances,
    importanceScore,
    version,
    updatedBy,
    createdAt,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'story_entities';
  @override
  VerificationContext validateIntegrity(
    Insertable<StoryEntity> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('project_id')) {
      context.handle(
        _projectIdMeta,
        projectId.isAcceptableOrUnknown(data['project_id']!, _projectIdMeta),
      );
    } else if (isInserting) {
      context.missing(_projectIdMeta);
    }
    if (data.containsKey('type')) {
      context.handle(
        _typeMeta,
        type.isAcceptableOrUnknown(data['type']!, _typeMeta),
      );
    } else if (isInserting) {
      context.missing(_typeMeta);
    }
    if (data.containsKey('template_id')) {
      context.handle(
        _templateIdMeta,
        templateId.isAcceptableOrUnknown(data['template_id']!, _templateIdMeta),
      );
    }
    if (data.containsKey('title')) {
      context.handle(
        _titleMeta,
        title.isAcceptableOrUnknown(data['title']!, _titleMeta),
      );
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('description')) {
      context.handle(
        _descriptionMeta,
        description.isAcceptableOrUnknown(
          data['description']!,
          _descriptionMeta,
        ),
      );
    }
    if (data.containsKey('image_source')) {
      context.handle(
        _imageSourceMeta,
        imageSource.isAcceptableOrUnknown(
          data['image_source']!,
          _imageSourceMeta,
        ),
      );
    }
    if (data.containsKey('image_path')) {
      context.handle(
        _imagePathMeta,
        imagePath.isAcceptableOrUnknown(data['image_path']!, _imagePathMeta),
      );
    }
    if (data.containsKey('thumbnail_path')) {
      context.handle(
        _thumbnailPathMeta,
        thumbnailPath.isAcceptableOrUnknown(
          data['thumbnail_path']!,
          _thumbnailPathMeta,
        ),
      );
    }
    if (data.containsKey('metadata_json')) {
      context.handle(
        _metadataJsonMeta,
        metadataJson.isAcceptableOrUnknown(
          data['metadata_json']!,
          _metadataJsonMeta,
        ),
      );
    }
    if (data.containsKey('ai_summary')) {
      context.handle(
        _aiSummaryMeta,
        aiSummary.isAcceptableOrUnknown(data['ai_summary']!, _aiSummaryMeta),
      );
    }
    if (data.containsKey('embedding_version')) {
      context.handle(
        _embeddingVersionMeta,
        embeddingVersion.isAcceptableOrUnknown(
          data['embedding_version']!,
          _embeddingVersionMeta,
        ),
      );
    }
    if (data.containsKey('connection_count')) {
      context.handle(
        _connectionCountMeta,
        connectionCount.isAcceptableOrUnknown(
          data['connection_count']!,
          _connectionCountMeta,
        ),
      );
    }
    if (data.containsKey('scene_appearances')) {
      context.handle(
        _sceneAppearancesMeta,
        sceneAppearances.isAcceptableOrUnknown(
          data['scene_appearances']!,
          _sceneAppearancesMeta,
        ),
      );
    }
    if (data.containsKey('importance_score')) {
      context.handle(
        _importanceScoreMeta,
        importanceScore.isAcceptableOrUnknown(
          data['importance_score']!,
          _importanceScoreMeta,
        ),
      );
    }
    if (data.containsKey('version')) {
      context.handle(
        _versionMeta,
        version.isAcceptableOrUnknown(data['version']!, _versionMeta),
      );
    }
    if (data.containsKey('updated_by')) {
      context.handle(
        _updatedByMeta,
        updatedBy.isAcceptableOrUnknown(data['updated_by']!, _updatedByMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  StoryEntity map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return StoryEntity(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      projectId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}project_id'],
      )!,
      type: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}type'],
      )!,
      templateId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}template_id'],
      ),
      title: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}title'],
      )!,
      description: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}description'],
      ),
      imageSource: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}image_source'],
      ),
      imagePath: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}image_path'],
      ),
      thumbnailPath: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}thumbnail_path'],
      ),
      metadataJson: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}metadata_json'],
      ),
      aiSummary: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}ai_summary'],
      ),
      embeddingVersion: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}embedding_version'],
      ),
      connectionCount: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}connection_count'],
      )!,
      sceneAppearances: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}scene_appearances'],
      )!,
      importanceScore: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}importance_score'],
      )!,
      version: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}version'],
      )!,
      updatedBy: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}updated_by'],
      ),
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $StoryEntitiesTable createAlias(String alias) {
    return $StoryEntitiesTable(attachedDatabase, alias);
  }
}

class StoryEntity extends DataClass implements Insertable<StoryEntity> {
  final String id;
  final String projectId;
  final String type;
  final String? templateId;
  final String title;
  final String? description;
  final String? imageSource;
  final String? imagePath;
  final String? thumbnailPath;
  final String? metadataJson;
  final String? aiSummary;
  final String? embeddingVersion;
  final int connectionCount;
  final int sceneAppearances;
  final int importanceScore;
  final int version;
  final String? updatedBy;
  final DateTime createdAt;
  final DateTime updatedAt;
  const StoryEntity({
    required this.id,
    required this.projectId,
    required this.type,
    this.templateId,
    required this.title,
    this.description,
    this.imageSource,
    this.imagePath,
    this.thumbnailPath,
    this.metadataJson,
    this.aiSummary,
    this.embeddingVersion,
    required this.connectionCount,
    required this.sceneAppearances,
    required this.importanceScore,
    required this.version,
    this.updatedBy,
    required this.createdAt,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['project_id'] = Variable<String>(projectId);
    map['type'] = Variable<String>(type);
    if (!nullToAbsent || templateId != null) {
      map['template_id'] = Variable<String>(templateId);
    }
    map['title'] = Variable<String>(title);
    if (!nullToAbsent || description != null) {
      map['description'] = Variable<String>(description);
    }
    if (!nullToAbsent || imageSource != null) {
      map['image_source'] = Variable<String>(imageSource);
    }
    if (!nullToAbsent || imagePath != null) {
      map['image_path'] = Variable<String>(imagePath);
    }
    if (!nullToAbsent || thumbnailPath != null) {
      map['thumbnail_path'] = Variable<String>(thumbnailPath);
    }
    if (!nullToAbsent || metadataJson != null) {
      map['metadata_json'] = Variable<String>(metadataJson);
    }
    if (!nullToAbsent || aiSummary != null) {
      map['ai_summary'] = Variable<String>(aiSummary);
    }
    if (!nullToAbsent || embeddingVersion != null) {
      map['embedding_version'] = Variable<String>(embeddingVersion);
    }
    map['connection_count'] = Variable<int>(connectionCount);
    map['scene_appearances'] = Variable<int>(sceneAppearances);
    map['importance_score'] = Variable<int>(importanceScore);
    map['version'] = Variable<int>(version);
    if (!nullToAbsent || updatedBy != null) {
      map['updated_by'] = Variable<String>(updatedBy);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  StoryEntitiesCompanion toCompanion(bool nullToAbsent) {
    return StoryEntitiesCompanion(
      id: Value(id),
      projectId: Value(projectId),
      type: Value(type),
      templateId: templateId == null && nullToAbsent
          ? const Value.absent()
          : Value(templateId),
      title: Value(title),
      description: description == null && nullToAbsent
          ? const Value.absent()
          : Value(description),
      imageSource: imageSource == null && nullToAbsent
          ? const Value.absent()
          : Value(imageSource),
      imagePath: imagePath == null && nullToAbsent
          ? const Value.absent()
          : Value(imagePath),
      thumbnailPath: thumbnailPath == null && nullToAbsent
          ? const Value.absent()
          : Value(thumbnailPath),
      metadataJson: metadataJson == null && nullToAbsent
          ? const Value.absent()
          : Value(metadataJson),
      aiSummary: aiSummary == null && nullToAbsent
          ? const Value.absent()
          : Value(aiSummary),
      embeddingVersion: embeddingVersion == null && nullToAbsent
          ? const Value.absent()
          : Value(embeddingVersion),
      connectionCount: Value(connectionCount),
      sceneAppearances: Value(sceneAppearances),
      importanceScore: Value(importanceScore),
      version: Value(version),
      updatedBy: updatedBy == null && nullToAbsent
          ? const Value.absent()
          : Value(updatedBy),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
    );
  }

  factory StoryEntity.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return StoryEntity(
      id: serializer.fromJson<String>(json['id']),
      projectId: serializer.fromJson<String>(json['projectId']),
      type: serializer.fromJson<String>(json['type']),
      templateId: serializer.fromJson<String?>(json['templateId']),
      title: serializer.fromJson<String>(json['title']),
      description: serializer.fromJson<String?>(json['description']),
      imageSource: serializer.fromJson<String?>(json['imageSource']),
      imagePath: serializer.fromJson<String?>(json['imagePath']),
      thumbnailPath: serializer.fromJson<String?>(json['thumbnailPath']),
      metadataJson: serializer.fromJson<String?>(json['metadataJson']),
      aiSummary: serializer.fromJson<String?>(json['aiSummary']),
      embeddingVersion: serializer.fromJson<String?>(json['embeddingVersion']),
      connectionCount: serializer.fromJson<int>(json['connectionCount']),
      sceneAppearances: serializer.fromJson<int>(json['sceneAppearances']),
      importanceScore: serializer.fromJson<int>(json['importanceScore']),
      version: serializer.fromJson<int>(json['version']),
      updatedBy: serializer.fromJson<String?>(json['updatedBy']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'projectId': serializer.toJson<String>(projectId),
      'type': serializer.toJson<String>(type),
      'templateId': serializer.toJson<String?>(templateId),
      'title': serializer.toJson<String>(title),
      'description': serializer.toJson<String?>(description),
      'imageSource': serializer.toJson<String?>(imageSource),
      'imagePath': serializer.toJson<String?>(imagePath),
      'thumbnailPath': serializer.toJson<String?>(thumbnailPath),
      'metadataJson': serializer.toJson<String?>(metadataJson),
      'aiSummary': serializer.toJson<String?>(aiSummary),
      'embeddingVersion': serializer.toJson<String?>(embeddingVersion),
      'connectionCount': serializer.toJson<int>(connectionCount),
      'sceneAppearances': serializer.toJson<int>(sceneAppearances),
      'importanceScore': serializer.toJson<int>(importanceScore),
      'version': serializer.toJson<int>(version),
      'updatedBy': serializer.toJson<String?>(updatedBy),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  StoryEntity copyWith({
    String? id,
    String? projectId,
    String? type,
    Value<String?> templateId = const Value.absent(),
    String? title,
    Value<String?> description = const Value.absent(),
    Value<String?> imageSource = const Value.absent(),
    Value<String?> imagePath = const Value.absent(),
    Value<String?> thumbnailPath = const Value.absent(),
    Value<String?> metadataJson = const Value.absent(),
    Value<String?> aiSummary = const Value.absent(),
    Value<String?> embeddingVersion = const Value.absent(),
    int? connectionCount,
    int? sceneAppearances,
    int? importanceScore,
    int? version,
    Value<String?> updatedBy = const Value.absent(),
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => StoryEntity(
    id: id ?? this.id,
    projectId: projectId ?? this.projectId,
    type: type ?? this.type,
    templateId: templateId.present ? templateId.value : this.templateId,
    title: title ?? this.title,
    description: description.present ? description.value : this.description,
    imageSource: imageSource.present ? imageSource.value : this.imageSource,
    imagePath: imagePath.present ? imagePath.value : this.imagePath,
    thumbnailPath: thumbnailPath.present
        ? thumbnailPath.value
        : this.thumbnailPath,
    metadataJson: metadataJson.present ? metadataJson.value : this.metadataJson,
    aiSummary: aiSummary.present ? aiSummary.value : this.aiSummary,
    embeddingVersion: embeddingVersion.present
        ? embeddingVersion.value
        : this.embeddingVersion,
    connectionCount: connectionCount ?? this.connectionCount,
    sceneAppearances: sceneAppearances ?? this.sceneAppearances,
    importanceScore: importanceScore ?? this.importanceScore,
    version: version ?? this.version,
    updatedBy: updatedBy.present ? updatedBy.value : this.updatedBy,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  StoryEntity copyWithCompanion(StoryEntitiesCompanion data) {
    return StoryEntity(
      id: data.id.present ? data.id.value : this.id,
      projectId: data.projectId.present ? data.projectId.value : this.projectId,
      type: data.type.present ? data.type.value : this.type,
      templateId: data.templateId.present
          ? data.templateId.value
          : this.templateId,
      title: data.title.present ? data.title.value : this.title,
      description: data.description.present
          ? data.description.value
          : this.description,
      imageSource: data.imageSource.present
          ? data.imageSource.value
          : this.imageSource,
      imagePath: data.imagePath.present ? data.imagePath.value : this.imagePath,
      thumbnailPath: data.thumbnailPath.present
          ? data.thumbnailPath.value
          : this.thumbnailPath,
      metadataJson: data.metadataJson.present
          ? data.metadataJson.value
          : this.metadataJson,
      aiSummary: data.aiSummary.present ? data.aiSummary.value : this.aiSummary,
      embeddingVersion: data.embeddingVersion.present
          ? data.embeddingVersion.value
          : this.embeddingVersion,
      connectionCount: data.connectionCount.present
          ? data.connectionCount.value
          : this.connectionCount,
      sceneAppearances: data.sceneAppearances.present
          ? data.sceneAppearances.value
          : this.sceneAppearances,
      importanceScore: data.importanceScore.present
          ? data.importanceScore.value
          : this.importanceScore,
      version: data.version.present ? data.version.value : this.version,
      updatedBy: data.updatedBy.present ? data.updatedBy.value : this.updatedBy,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('StoryEntity(')
          ..write('id: $id, ')
          ..write('projectId: $projectId, ')
          ..write('type: $type, ')
          ..write('templateId: $templateId, ')
          ..write('title: $title, ')
          ..write('description: $description, ')
          ..write('imageSource: $imageSource, ')
          ..write('imagePath: $imagePath, ')
          ..write('thumbnailPath: $thumbnailPath, ')
          ..write('metadataJson: $metadataJson, ')
          ..write('aiSummary: $aiSummary, ')
          ..write('embeddingVersion: $embeddingVersion, ')
          ..write('connectionCount: $connectionCount, ')
          ..write('sceneAppearances: $sceneAppearances, ')
          ..write('importanceScore: $importanceScore, ')
          ..write('version: $version, ')
          ..write('updatedBy: $updatedBy, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    projectId,
    type,
    templateId,
    title,
    description,
    imageSource,
    imagePath,
    thumbnailPath,
    metadataJson,
    aiSummary,
    embeddingVersion,
    connectionCount,
    sceneAppearances,
    importanceScore,
    version,
    updatedBy,
    createdAt,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is StoryEntity &&
          other.id == this.id &&
          other.projectId == this.projectId &&
          other.type == this.type &&
          other.templateId == this.templateId &&
          other.title == this.title &&
          other.description == this.description &&
          other.imageSource == this.imageSource &&
          other.imagePath == this.imagePath &&
          other.thumbnailPath == this.thumbnailPath &&
          other.metadataJson == this.metadataJson &&
          other.aiSummary == this.aiSummary &&
          other.embeddingVersion == this.embeddingVersion &&
          other.connectionCount == this.connectionCount &&
          other.sceneAppearances == this.sceneAppearances &&
          other.importanceScore == this.importanceScore &&
          other.version == this.version &&
          other.updatedBy == this.updatedBy &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt);
}

class StoryEntitiesCompanion extends UpdateCompanion<StoryEntity> {
  final Value<String> id;
  final Value<String> projectId;
  final Value<String> type;
  final Value<String?> templateId;
  final Value<String> title;
  final Value<String?> description;
  final Value<String?> imageSource;
  final Value<String?> imagePath;
  final Value<String?> thumbnailPath;
  final Value<String?> metadataJson;
  final Value<String?> aiSummary;
  final Value<String?> embeddingVersion;
  final Value<int> connectionCount;
  final Value<int> sceneAppearances;
  final Value<int> importanceScore;
  final Value<int> version;
  final Value<String?> updatedBy;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const StoryEntitiesCompanion({
    this.id = const Value.absent(),
    this.projectId = const Value.absent(),
    this.type = const Value.absent(),
    this.templateId = const Value.absent(),
    this.title = const Value.absent(),
    this.description = const Value.absent(),
    this.imageSource = const Value.absent(),
    this.imagePath = const Value.absent(),
    this.thumbnailPath = const Value.absent(),
    this.metadataJson = const Value.absent(),
    this.aiSummary = const Value.absent(),
    this.embeddingVersion = const Value.absent(),
    this.connectionCount = const Value.absent(),
    this.sceneAppearances = const Value.absent(),
    this.importanceScore = const Value.absent(),
    this.version = const Value.absent(),
    this.updatedBy = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  StoryEntitiesCompanion.insert({
    required String id,
    required String projectId,
    required String type,
    this.templateId = const Value.absent(),
    required String title,
    this.description = const Value.absent(),
    this.imageSource = const Value.absent(),
    this.imagePath = const Value.absent(),
    this.thumbnailPath = const Value.absent(),
    this.metadataJson = const Value.absent(),
    this.aiSummary = const Value.absent(),
    this.embeddingVersion = const Value.absent(),
    this.connectionCount = const Value.absent(),
    this.sceneAppearances = const Value.absent(),
    this.importanceScore = const Value.absent(),
    this.version = const Value.absent(),
    this.updatedBy = const Value.absent(),
    required DateTime createdAt,
    required DateTime updatedAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       projectId = Value(projectId),
       type = Value(type),
       title = Value(title),
       createdAt = Value(createdAt),
       updatedAt = Value(updatedAt);
  static Insertable<StoryEntity> custom({
    Expression<String>? id,
    Expression<String>? projectId,
    Expression<String>? type,
    Expression<String>? templateId,
    Expression<String>? title,
    Expression<String>? description,
    Expression<String>? imageSource,
    Expression<String>? imagePath,
    Expression<String>? thumbnailPath,
    Expression<String>? metadataJson,
    Expression<String>? aiSummary,
    Expression<String>? embeddingVersion,
    Expression<int>? connectionCount,
    Expression<int>? sceneAppearances,
    Expression<int>? importanceScore,
    Expression<int>? version,
    Expression<String>? updatedBy,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (projectId != null) 'project_id': projectId,
      if (type != null) 'type': type,
      if (templateId != null) 'template_id': templateId,
      if (title != null) 'title': title,
      if (description != null) 'description': description,
      if (imageSource != null) 'image_source': imageSource,
      if (imagePath != null) 'image_path': imagePath,
      if (thumbnailPath != null) 'thumbnail_path': thumbnailPath,
      if (metadataJson != null) 'metadata_json': metadataJson,
      if (aiSummary != null) 'ai_summary': aiSummary,
      if (embeddingVersion != null) 'embedding_version': embeddingVersion,
      if (connectionCount != null) 'connection_count': connectionCount,
      if (sceneAppearances != null) 'scene_appearances': sceneAppearances,
      if (importanceScore != null) 'importance_score': importanceScore,
      if (version != null) 'version': version,
      if (updatedBy != null) 'updated_by': updatedBy,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  StoryEntitiesCompanion copyWith({
    Value<String>? id,
    Value<String>? projectId,
    Value<String>? type,
    Value<String?>? templateId,
    Value<String>? title,
    Value<String?>? description,
    Value<String?>? imageSource,
    Value<String?>? imagePath,
    Value<String?>? thumbnailPath,
    Value<String?>? metadataJson,
    Value<String?>? aiSummary,
    Value<String?>? embeddingVersion,
    Value<int>? connectionCount,
    Value<int>? sceneAppearances,
    Value<int>? importanceScore,
    Value<int>? version,
    Value<String?>? updatedBy,
    Value<DateTime>? createdAt,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return StoryEntitiesCompanion(
      id: id ?? this.id,
      projectId: projectId ?? this.projectId,
      type: type ?? this.type,
      templateId: templateId ?? this.templateId,
      title: title ?? this.title,
      description: description ?? this.description,
      imageSource: imageSource ?? this.imageSource,
      imagePath: imagePath ?? this.imagePath,
      thumbnailPath: thumbnailPath ?? this.thumbnailPath,
      metadataJson: metadataJson ?? this.metadataJson,
      aiSummary: aiSummary ?? this.aiSummary,
      embeddingVersion: embeddingVersion ?? this.embeddingVersion,
      connectionCount: connectionCount ?? this.connectionCount,
      sceneAppearances: sceneAppearances ?? this.sceneAppearances,
      importanceScore: importanceScore ?? this.importanceScore,
      version: version ?? this.version,
      updatedBy: updatedBy ?? this.updatedBy,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (projectId.present) {
      map['project_id'] = Variable<String>(projectId.value);
    }
    if (type.present) {
      map['type'] = Variable<String>(type.value);
    }
    if (templateId.present) {
      map['template_id'] = Variable<String>(templateId.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (description.present) {
      map['description'] = Variable<String>(description.value);
    }
    if (imageSource.present) {
      map['image_source'] = Variable<String>(imageSource.value);
    }
    if (imagePath.present) {
      map['image_path'] = Variable<String>(imagePath.value);
    }
    if (thumbnailPath.present) {
      map['thumbnail_path'] = Variable<String>(thumbnailPath.value);
    }
    if (metadataJson.present) {
      map['metadata_json'] = Variable<String>(metadataJson.value);
    }
    if (aiSummary.present) {
      map['ai_summary'] = Variable<String>(aiSummary.value);
    }
    if (embeddingVersion.present) {
      map['embedding_version'] = Variable<String>(embeddingVersion.value);
    }
    if (connectionCount.present) {
      map['connection_count'] = Variable<int>(connectionCount.value);
    }
    if (sceneAppearances.present) {
      map['scene_appearances'] = Variable<int>(sceneAppearances.value);
    }
    if (importanceScore.present) {
      map['importance_score'] = Variable<int>(importanceScore.value);
    }
    if (version.present) {
      map['version'] = Variable<int>(version.value);
    }
    if (updatedBy.present) {
      map['updated_by'] = Variable<String>(updatedBy.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('StoryEntitiesCompanion(')
          ..write('id: $id, ')
          ..write('projectId: $projectId, ')
          ..write('type: $type, ')
          ..write('templateId: $templateId, ')
          ..write('title: $title, ')
          ..write('description: $description, ')
          ..write('imageSource: $imageSource, ')
          ..write('imagePath: $imagePath, ')
          ..write('thumbnailPath: $thumbnailPath, ')
          ..write('metadataJson: $metadataJson, ')
          ..write('aiSummary: $aiSummary, ')
          ..write('embeddingVersion: $embeddingVersion, ')
          ..write('connectionCount: $connectionCount, ')
          ..write('sceneAppearances: $sceneAppearances, ')
          ..write('importanceScore: $importanceScore, ')
          ..write('version: $version, ')
          ..write('updatedBy: $updatedBy, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $EntityRelationshipsTable extends EntityRelationships
    with TableInfo<$EntityRelationshipsTable, EntityRelationship> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $EntityRelationshipsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _projectIdMeta = const VerificationMeta(
    'projectId',
  );
  @override
  late final GeneratedColumn<String> projectId = GeneratedColumn<String>(
    'project_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES projects (id)',
    ),
  );
  static const VerificationMeta _sourceEntityIdMeta = const VerificationMeta(
    'sourceEntityId',
  );
  @override
  late final GeneratedColumn<String> sourceEntityId = GeneratedColumn<String>(
    'source_entity_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES story_entities (id)',
    ),
  );
  static const VerificationMeta _targetEntityIdMeta = const VerificationMeta(
    'targetEntityId',
  );
  @override
  late final GeneratedColumn<String> targetEntityId = GeneratedColumn<String>(
    'target_entity_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES story_entities (id)',
    ),
  );
  static const VerificationMeta _relationshipTypeMeta = const VerificationMeta(
    'relationshipType',
  );
  @override
  late final GeneratedColumn<String> relationshipType = GeneratedColumn<String>(
    'relationship_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _strengthMeta = const VerificationMeta(
    'strength',
  );
  @override
  late final GeneratedColumn<int> strength = GeneratedColumn<int>(
    'strength',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(50),
  );
  static const VerificationMeta _directionMeta = const VerificationMeta(
    'direction',
  );
  @override
  late final GeneratedColumn<String> direction = GeneratedColumn<String>(
    'direction',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('bidirectional'),
  );
  static const VerificationMeta _descriptionMeta = const VerificationMeta(
    'description',
  );
  @override
  late final GeneratedColumn<String> description = GeneratedColumn<String>(
    'description',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
    'notes',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _metadataJsonMeta = const VerificationMeta(
    'metadataJson',
  );
  @override
  late final GeneratedColumn<String> metadataJson = GeneratedColumn<String>(
    'metadata_json',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _versionMeta = const VerificationMeta(
    'version',
  );
  @override
  late final GeneratedColumn<int> version = GeneratedColumn<int>(
    'version',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _updatedByMeta = const VerificationMeta(
    'updatedBy',
  );
  @override
  late final GeneratedColumn<String> updatedBy = GeneratedColumn<String>(
    'updated_by',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    projectId,
    sourceEntityId,
    targetEntityId,
    relationshipType,
    strength,
    direction,
    description,
    notes,
    metadataJson,
    version,
    updatedBy,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'entity_relationships';
  @override
  VerificationContext validateIntegrity(
    Insertable<EntityRelationship> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('project_id')) {
      context.handle(
        _projectIdMeta,
        projectId.isAcceptableOrUnknown(data['project_id']!, _projectIdMeta),
      );
    } else if (isInserting) {
      context.missing(_projectIdMeta);
    }
    if (data.containsKey('source_entity_id')) {
      context.handle(
        _sourceEntityIdMeta,
        sourceEntityId.isAcceptableOrUnknown(
          data['source_entity_id']!,
          _sourceEntityIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_sourceEntityIdMeta);
    }
    if (data.containsKey('target_entity_id')) {
      context.handle(
        _targetEntityIdMeta,
        targetEntityId.isAcceptableOrUnknown(
          data['target_entity_id']!,
          _targetEntityIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_targetEntityIdMeta);
    }
    if (data.containsKey('relationship_type')) {
      context.handle(
        _relationshipTypeMeta,
        relationshipType.isAcceptableOrUnknown(
          data['relationship_type']!,
          _relationshipTypeMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_relationshipTypeMeta);
    }
    if (data.containsKey('strength')) {
      context.handle(
        _strengthMeta,
        strength.isAcceptableOrUnknown(data['strength']!, _strengthMeta),
      );
    }
    if (data.containsKey('direction')) {
      context.handle(
        _directionMeta,
        direction.isAcceptableOrUnknown(data['direction']!, _directionMeta),
      );
    }
    if (data.containsKey('description')) {
      context.handle(
        _descriptionMeta,
        description.isAcceptableOrUnknown(
          data['description']!,
          _descriptionMeta,
        ),
      );
    }
    if (data.containsKey('notes')) {
      context.handle(
        _notesMeta,
        notes.isAcceptableOrUnknown(data['notes']!, _notesMeta),
      );
    }
    if (data.containsKey('metadata_json')) {
      context.handle(
        _metadataJsonMeta,
        metadataJson.isAcceptableOrUnknown(
          data['metadata_json']!,
          _metadataJsonMeta,
        ),
      );
    }
    if (data.containsKey('version')) {
      context.handle(
        _versionMeta,
        version.isAcceptableOrUnknown(data['version']!, _versionMeta),
      );
    }
    if (data.containsKey('updated_by')) {
      context.handle(
        _updatedByMeta,
        updatedBy.isAcceptableOrUnknown(data['updated_by']!, _updatedByMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  EntityRelationship map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return EntityRelationship(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      projectId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}project_id'],
      )!,
      sourceEntityId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}source_entity_id'],
      )!,
      targetEntityId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}target_entity_id'],
      )!,
      relationshipType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}relationship_type'],
      )!,
      strength: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}strength'],
      )!,
      direction: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}direction'],
      )!,
      description: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}description'],
      ),
      notes: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}notes'],
      ),
      metadataJson: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}metadata_json'],
      ),
      version: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}version'],
      )!,
      updatedBy: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}updated_by'],
      ),
    );
  }

  @override
  $EntityRelationshipsTable createAlias(String alias) {
    return $EntityRelationshipsTable(attachedDatabase, alias);
  }
}

class EntityRelationship extends DataClass
    implements Insertable<EntityRelationship> {
  final String id;
  final String projectId;
  final String sourceEntityId;
  final String targetEntityId;
  final String relationshipType;
  final int strength;
  final String direction;
  final String? description;
  final String? notes;
  final String? metadataJson;
  final int version;
  final String? updatedBy;
  const EntityRelationship({
    required this.id,
    required this.projectId,
    required this.sourceEntityId,
    required this.targetEntityId,
    required this.relationshipType,
    required this.strength,
    required this.direction,
    this.description,
    this.notes,
    this.metadataJson,
    required this.version,
    this.updatedBy,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['project_id'] = Variable<String>(projectId);
    map['source_entity_id'] = Variable<String>(sourceEntityId);
    map['target_entity_id'] = Variable<String>(targetEntityId);
    map['relationship_type'] = Variable<String>(relationshipType);
    map['strength'] = Variable<int>(strength);
    map['direction'] = Variable<String>(direction);
    if (!nullToAbsent || description != null) {
      map['description'] = Variable<String>(description);
    }
    if (!nullToAbsent || notes != null) {
      map['notes'] = Variable<String>(notes);
    }
    if (!nullToAbsent || metadataJson != null) {
      map['metadata_json'] = Variable<String>(metadataJson);
    }
    map['version'] = Variable<int>(version);
    if (!nullToAbsent || updatedBy != null) {
      map['updated_by'] = Variable<String>(updatedBy);
    }
    return map;
  }

  EntityRelationshipsCompanion toCompanion(bool nullToAbsent) {
    return EntityRelationshipsCompanion(
      id: Value(id),
      projectId: Value(projectId),
      sourceEntityId: Value(sourceEntityId),
      targetEntityId: Value(targetEntityId),
      relationshipType: Value(relationshipType),
      strength: Value(strength),
      direction: Value(direction),
      description: description == null && nullToAbsent
          ? const Value.absent()
          : Value(description),
      notes: notes == null && nullToAbsent
          ? const Value.absent()
          : Value(notes),
      metadataJson: metadataJson == null && nullToAbsent
          ? const Value.absent()
          : Value(metadataJson),
      version: Value(version),
      updatedBy: updatedBy == null && nullToAbsent
          ? const Value.absent()
          : Value(updatedBy),
    );
  }

  factory EntityRelationship.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return EntityRelationship(
      id: serializer.fromJson<String>(json['id']),
      projectId: serializer.fromJson<String>(json['projectId']),
      sourceEntityId: serializer.fromJson<String>(json['sourceEntityId']),
      targetEntityId: serializer.fromJson<String>(json['targetEntityId']),
      relationshipType: serializer.fromJson<String>(json['relationshipType']),
      strength: serializer.fromJson<int>(json['strength']),
      direction: serializer.fromJson<String>(json['direction']),
      description: serializer.fromJson<String?>(json['description']),
      notes: serializer.fromJson<String?>(json['notes']),
      metadataJson: serializer.fromJson<String?>(json['metadataJson']),
      version: serializer.fromJson<int>(json['version']),
      updatedBy: serializer.fromJson<String?>(json['updatedBy']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'projectId': serializer.toJson<String>(projectId),
      'sourceEntityId': serializer.toJson<String>(sourceEntityId),
      'targetEntityId': serializer.toJson<String>(targetEntityId),
      'relationshipType': serializer.toJson<String>(relationshipType),
      'strength': serializer.toJson<int>(strength),
      'direction': serializer.toJson<String>(direction),
      'description': serializer.toJson<String?>(description),
      'notes': serializer.toJson<String?>(notes),
      'metadataJson': serializer.toJson<String?>(metadataJson),
      'version': serializer.toJson<int>(version),
      'updatedBy': serializer.toJson<String?>(updatedBy),
    };
  }

  EntityRelationship copyWith({
    String? id,
    String? projectId,
    String? sourceEntityId,
    String? targetEntityId,
    String? relationshipType,
    int? strength,
    String? direction,
    Value<String?> description = const Value.absent(),
    Value<String?> notes = const Value.absent(),
    Value<String?> metadataJson = const Value.absent(),
    int? version,
    Value<String?> updatedBy = const Value.absent(),
  }) => EntityRelationship(
    id: id ?? this.id,
    projectId: projectId ?? this.projectId,
    sourceEntityId: sourceEntityId ?? this.sourceEntityId,
    targetEntityId: targetEntityId ?? this.targetEntityId,
    relationshipType: relationshipType ?? this.relationshipType,
    strength: strength ?? this.strength,
    direction: direction ?? this.direction,
    description: description.present ? description.value : this.description,
    notes: notes.present ? notes.value : this.notes,
    metadataJson: metadataJson.present ? metadataJson.value : this.metadataJson,
    version: version ?? this.version,
    updatedBy: updatedBy.present ? updatedBy.value : this.updatedBy,
  );
  EntityRelationship copyWithCompanion(EntityRelationshipsCompanion data) {
    return EntityRelationship(
      id: data.id.present ? data.id.value : this.id,
      projectId: data.projectId.present ? data.projectId.value : this.projectId,
      sourceEntityId: data.sourceEntityId.present
          ? data.sourceEntityId.value
          : this.sourceEntityId,
      targetEntityId: data.targetEntityId.present
          ? data.targetEntityId.value
          : this.targetEntityId,
      relationshipType: data.relationshipType.present
          ? data.relationshipType.value
          : this.relationshipType,
      strength: data.strength.present ? data.strength.value : this.strength,
      direction: data.direction.present ? data.direction.value : this.direction,
      description: data.description.present
          ? data.description.value
          : this.description,
      notes: data.notes.present ? data.notes.value : this.notes,
      metadataJson: data.metadataJson.present
          ? data.metadataJson.value
          : this.metadataJson,
      version: data.version.present ? data.version.value : this.version,
      updatedBy: data.updatedBy.present ? data.updatedBy.value : this.updatedBy,
    );
  }

  @override
  String toString() {
    return (StringBuffer('EntityRelationship(')
          ..write('id: $id, ')
          ..write('projectId: $projectId, ')
          ..write('sourceEntityId: $sourceEntityId, ')
          ..write('targetEntityId: $targetEntityId, ')
          ..write('relationshipType: $relationshipType, ')
          ..write('strength: $strength, ')
          ..write('direction: $direction, ')
          ..write('description: $description, ')
          ..write('notes: $notes, ')
          ..write('metadataJson: $metadataJson, ')
          ..write('version: $version, ')
          ..write('updatedBy: $updatedBy')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    projectId,
    sourceEntityId,
    targetEntityId,
    relationshipType,
    strength,
    direction,
    description,
    notes,
    metadataJson,
    version,
    updatedBy,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is EntityRelationship &&
          other.id == this.id &&
          other.projectId == this.projectId &&
          other.sourceEntityId == this.sourceEntityId &&
          other.targetEntityId == this.targetEntityId &&
          other.relationshipType == this.relationshipType &&
          other.strength == this.strength &&
          other.direction == this.direction &&
          other.description == this.description &&
          other.notes == this.notes &&
          other.metadataJson == this.metadataJson &&
          other.version == this.version &&
          other.updatedBy == this.updatedBy);
}

class EntityRelationshipsCompanion extends UpdateCompanion<EntityRelationship> {
  final Value<String> id;
  final Value<String> projectId;
  final Value<String> sourceEntityId;
  final Value<String> targetEntityId;
  final Value<String> relationshipType;
  final Value<int> strength;
  final Value<String> direction;
  final Value<String?> description;
  final Value<String?> notes;
  final Value<String?> metadataJson;
  final Value<int> version;
  final Value<String?> updatedBy;
  final Value<int> rowid;
  const EntityRelationshipsCompanion({
    this.id = const Value.absent(),
    this.projectId = const Value.absent(),
    this.sourceEntityId = const Value.absent(),
    this.targetEntityId = const Value.absent(),
    this.relationshipType = const Value.absent(),
    this.strength = const Value.absent(),
    this.direction = const Value.absent(),
    this.description = const Value.absent(),
    this.notes = const Value.absent(),
    this.metadataJson = const Value.absent(),
    this.version = const Value.absent(),
    this.updatedBy = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  EntityRelationshipsCompanion.insert({
    required String id,
    required String projectId,
    required String sourceEntityId,
    required String targetEntityId,
    required String relationshipType,
    this.strength = const Value.absent(),
    this.direction = const Value.absent(),
    this.description = const Value.absent(),
    this.notes = const Value.absent(),
    this.metadataJson = const Value.absent(),
    this.version = const Value.absent(),
    this.updatedBy = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       projectId = Value(projectId),
       sourceEntityId = Value(sourceEntityId),
       targetEntityId = Value(targetEntityId),
       relationshipType = Value(relationshipType);
  static Insertable<EntityRelationship> custom({
    Expression<String>? id,
    Expression<String>? projectId,
    Expression<String>? sourceEntityId,
    Expression<String>? targetEntityId,
    Expression<String>? relationshipType,
    Expression<int>? strength,
    Expression<String>? direction,
    Expression<String>? description,
    Expression<String>? notes,
    Expression<String>? metadataJson,
    Expression<int>? version,
    Expression<String>? updatedBy,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (projectId != null) 'project_id': projectId,
      if (sourceEntityId != null) 'source_entity_id': sourceEntityId,
      if (targetEntityId != null) 'target_entity_id': targetEntityId,
      if (relationshipType != null) 'relationship_type': relationshipType,
      if (strength != null) 'strength': strength,
      if (direction != null) 'direction': direction,
      if (description != null) 'description': description,
      if (notes != null) 'notes': notes,
      if (metadataJson != null) 'metadata_json': metadataJson,
      if (version != null) 'version': version,
      if (updatedBy != null) 'updated_by': updatedBy,
      if (rowid != null) 'rowid': rowid,
    });
  }

  EntityRelationshipsCompanion copyWith({
    Value<String>? id,
    Value<String>? projectId,
    Value<String>? sourceEntityId,
    Value<String>? targetEntityId,
    Value<String>? relationshipType,
    Value<int>? strength,
    Value<String>? direction,
    Value<String?>? description,
    Value<String?>? notes,
    Value<String?>? metadataJson,
    Value<int>? version,
    Value<String?>? updatedBy,
    Value<int>? rowid,
  }) {
    return EntityRelationshipsCompanion(
      id: id ?? this.id,
      projectId: projectId ?? this.projectId,
      sourceEntityId: sourceEntityId ?? this.sourceEntityId,
      targetEntityId: targetEntityId ?? this.targetEntityId,
      relationshipType: relationshipType ?? this.relationshipType,
      strength: strength ?? this.strength,
      direction: direction ?? this.direction,
      description: description ?? this.description,
      notes: notes ?? this.notes,
      metadataJson: metadataJson ?? this.metadataJson,
      version: version ?? this.version,
      updatedBy: updatedBy ?? this.updatedBy,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (projectId.present) {
      map['project_id'] = Variable<String>(projectId.value);
    }
    if (sourceEntityId.present) {
      map['source_entity_id'] = Variable<String>(sourceEntityId.value);
    }
    if (targetEntityId.present) {
      map['target_entity_id'] = Variable<String>(targetEntityId.value);
    }
    if (relationshipType.present) {
      map['relationship_type'] = Variable<String>(relationshipType.value);
    }
    if (strength.present) {
      map['strength'] = Variable<int>(strength.value);
    }
    if (direction.present) {
      map['direction'] = Variable<String>(direction.value);
    }
    if (description.present) {
      map['description'] = Variable<String>(description.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (metadataJson.present) {
      map['metadata_json'] = Variable<String>(metadataJson.value);
    }
    if (version.present) {
      map['version'] = Variable<int>(version.value);
    }
    if (updatedBy.present) {
      map['updated_by'] = Variable<String>(updatedBy.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('EntityRelationshipsCompanion(')
          ..write('id: $id, ')
          ..write('projectId: $projectId, ')
          ..write('sourceEntityId: $sourceEntityId, ')
          ..write('targetEntityId: $targetEntityId, ')
          ..write('relationshipType: $relationshipType, ')
          ..write('strength: $strength, ')
          ..write('direction: $direction, ')
          ..write('description: $description, ')
          ..write('notes: $notes, ')
          ..write('metadataJson: $metadataJson, ')
          ..write('version: $version, ')
          ..write('updatedBy: $updatedBy, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $DraftsTable drafts = $DraftsTable(this);
  late final $SyncQueueTable syncQueue = $SyncQueueTable(this);
  late final $ProjectsTable projects = $ProjectsTable(this);
  late final $StoryEntitiesTable storyEntities = $StoryEntitiesTable(this);
  late final $EntityRelationshipsTable entityRelationships =
      $EntityRelationshipsTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    drafts,
    syncQueue,
    projects,
    storyEntities,
    entityRelationships,
  ];
}

typedef $$DraftsTableCreateCompanionBuilder =
    DraftsCompanion Function({
      Value<int> id,
      required String sceneId,
      Value<String?> contentDelta,
      Value<String?> contentHash,
      Value<String> formatVersion,
      Value<DraftSyncState> syncState,
      Value<int> wordCount,
      required DateTime lastSaved,
      Value<DateTime?> lastSyncedAt,
      Value<String?> deviceId,
      Value<int?> serverVersion,
    });
typedef $$DraftsTableUpdateCompanionBuilder =
    DraftsCompanion Function({
      Value<int> id,
      Value<String> sceneId,
      Value<String?> contentDelta,
      Value<String?> contentHash,
      Value<String> formatVersion,
      Value<DraftSyncState> syncState,
      Value<int> wordCount,
      Value<DateTime> lastSaved,
      Value<DateTime?> lastSyncedAt,
      Value<String?> deviceId,
      Value<int?> serverVersion,
    });

class $$DraftsTableFilterComposer
    extends Composer<_$AppDatabase, $DraftsTable> {
  $$DraftsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get sceneId => $composableBuilder(
    column: $table.sceneId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get contentDelta => $composableBuilder(
    column: $table.contentDelta,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get contentHash => $composableBuilder(
    column: $table.contentHash,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get formatVersion => $composableBuilder(
    column: $table.formatVersion,
    builder: (column) => ColumnFilters(column),
  );

  ColumnWithTypeConverterFilters<DraftSyncState, DraftSyncState, int>
  get syncState => $composableBuilder(
    column: $table.syncState,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );

  ColumnFilters<int> get wordCount => $composableBuilder(
    column: $table.wordCount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastSaved => $composableBuilder(
    column: $table.lastSaved,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastSyncedAt => $composableBuilder(
    column: $table.lastSyncedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get deviceId => $composableBuilder(
    column: $table.deviceId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get serverVersion => $composableBuilder(
    column: $table.serverVersion,
    builder: (column) => ColumnFilters(column),
  );
}

class $$DraftsTableOrderingComposer
    extends Composer<_$AppDatabase, $DraftsTable> {
  $$DraftsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get sceneId => $composableBuilder(
    column: $table.sceneId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get contentDelta => $composableBuilder(
    column: $table.contentDelta,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get contentHash => $composableBuilder(
    column: $table.contentHash,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get formatVersion => $composableBuilder(
    column: $table.formatVersion,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get syncState => $composableBuilder(
    column: $table.syncState,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get wordCount => $composableBuilder(
    column: $table.wordCount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastSaved => $composableBuilder(
    column: $table.lastSaved,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastSyncedAt => $composableBuilder(
    column: $table.lastSyncedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get deviceId => $composableBuilder(
    column: $table.deviceId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get serverVersion => $composableBuilder(
    column: $table.serverVersion,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$DraftsTableAnnotationComposer
    extends Composer<_$AppDatabase, $DraftsTable> {
  $$DraftsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get sceneId =>
      $composableBuilder(column: $table.sceneId, builder: (column) => column);

  GeneratedColumn<String> get contentDelta => $composableBuilder(
    column: $table.contentDelta,
    builder: (column) => column,
  );

  GeneratedColumn<String> get contentHash => $composableBuilder(
    column: $table.contentHash,
    builder: (column) => column,
  );

  GeneratedColumn<String> get formatVersion => $composableBuilder(
    column: $table.formatVersion,
    builder: (column) => column,
  );

  GeneratedColumnWithTypeConverter<DraftSyncState, int> get syncState =>
      $composableBuilder(column: $table.syncState, builder: (column) => column);

  GeneratedColumn<int> get wordCount =>
      $composableBuilder(column: $table.wordCount, builder: (column) => column);

  GeneratedColumn<DateTime> get lastSaved =>
      $composableBuilder(column: $table.lastSaved, builder: (column) => column);

  GeneratedColumn<DateTime> get lastSyncedAt => $composableBuilder(
    column: $table.lastSyncedAt,
    builder: (column) => column,
  );

  GeneratedColumn<String> get deviceId =>
      $composableBuilder(column: $table.deviceId, builder: (column) => column);

  GeneratedColumn<int> get serverVersion => $composableBuilder(
    column: $table.serverVersion,
    builder: (column) => column,
  );
}

class $$DraftsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $DraftsTable,
          Draft,
          $$DraftsTableFilterComposer,
          $$DraftsTableOrderingComposer,
          $$DraftsTableAnnotationComposer,
          $$DraftsTableCreateCompanionBuilder,
          $$DraftsTableUpdateCompanionBuilder,
          (Draft, BaseReferences<_$AppDatabase, $DraftsTable, Draft>),
          Draft,
          PrefetchHooks Function()
        > {
  $$DraftsTableTableManager(_$AppDatabase db, $DraftsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$DraftsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$DraftsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$DraftsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<String> sceneId = const Value.absent(),
                Value<String?> contentDelta = const Value.absent(),
                Value<String?> contentHash = const Value.absent(),
                Value<String> formatVersion = const Value.absent(),
                Value<DraftSyncState> syncState = const Value.absent(),
                Value<int> wordCount = const Value.absent(),
                Value<DateTime> lastSaved = const Value.absent(),
                Value<DateTime?> lastSyncedAt = const Value.absent(),
                Value<String?> deviceId = const Value.absent(),
                Value<int?> serverVersion = const Value.absent(),
              }) => DraftsCompanion(
                id: id,
                sceneId: sceneId,
                contentDelta: contentDelta,
                contentHash: contentHash,
                formatVersion: formatVersion,
                syncState: syncState,
                wordCount: wordCount,
                lastSaved: lastSaved,
                lastSyncedAt: lastSyncedAt,
                deviceId: deviceId,
                serverVersion: serverVersion,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required String sceneId,
                Value<String?> contentDelta = const Value.absent(),
                Value<String?> contentHash = const Value.absent(),
                Value<String> formatVersion = const Value.absent(),
                Value<DraftSyncState> syncState = const Value.absent(),
                Value<int> wordCount = const Value.absent(),
                required DateTime lastSaved,
                Value<DateTime?> lastSyncedAt = const Value.absent(),
                Value<String?> deviceId = const Value.absent(),
                Value<int?> serverVersion = const Value.absent(),
              }) => DraftsCompanion.insert(
                id: id,
                sceneId: sceneId,
                contentDelta: contentDelta,
                contentHash: contentHash,
                formatVersion: formatVersion,
                syncState: syncState,
                wordCount: wordCount,
                lastSaved: lastSaved,
                lastSyncedAt: lastSyncedAt,
                deviceId: deviceId,
                serverVersion: serverVersion,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$DraftsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $DraftsTable,
      Draft,
      $$DraftsTableFilterComposer,
      $$DraftsTableOrderingComposer,
      $$DraftsTableAnnotationComposer,
      $$DraftsTableCreateCompanionBuilder,
      $$DraftsTableUpdateCompanionBuilder,
      (Draft, BaseReferences<_$AppDatabase, $DraftsTable, Draft>),
      Draft,
      PrefetchHooks Function()
    >;
typedef $$SyncQueueTableCreateCompanionBuilder =
    SyncQueueCompanion Function({
      required String id,
      required String operationId,
      required String resourceType,
      required String resourceId,
      required String operation,
      Value<int> resourceVersion,
      required String payload,
      Value<DateTime> createdAt,
      Value<int> retryCount,
      Value<DateTime?> lastAttemptAt,
      Value<SyncQueueStatus> status,
      Value<int> rowid,
    });
typedef $$SyncQueueTableUpdateCompanionBuilder =
    SyncQueueCompanion Function({
      Value<String> id,
      Value<String> operationId,
      Value<String> resourceType,
      Value<String> resourceId,
      Value<String> operation,
      Value<int> resourceVersion,
      Value<String> payload,
      Value<DateTime> createdAt,
      Value<int> retryCount,
      Value<DateTime?> lastAttemptAt,
      Value<SyncQueueStatus> status,
      Value<int> rowid,
    });

class $$SyncQueueTableFilterComposer
    extends Composer<_$AppDatabase, $SyncQueueTable> {
  $$SyncQueueTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get operationId => $composableBuilder(
    column: $table.operationId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get resourceType => $composableBuilder(
    column: $table.resourceType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get resourceId => $composableBuilder(
    column: $table.resourceId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get operation => $composableBuilder(
    column: $table.operation,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get resourceVersion => $composableBuilder(
    column: $table.resourceVersion,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get retryCount => $composableBuilder(
    column: $table.retryCount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastAttemptAt => $composableBuilder(
    column: $table.lastAttemptAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnWithTypeConverterFilters<SyncQueueStatus, SyncQueueStatus, int>
  get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );
}

class $$SyncQueueTableOrderingComposer
    extends Composer<_$AppDatabase, $SyncQueueTable> {
  $$SyncQueueTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get operationId => $composableBuilder(
    column: $table.operationId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get resourceType => $composableBuilder(
    column: $table.resourceType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get resourceId => $composableBuilder(
    column: $table.resourceId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get operation => $composableBuilder(
    column: $table.operation,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get resourceVersion => $composableBuilder(
    column: $table.resourceVersion,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get retryCount => $composableBuilder(
    column: $table.retryCount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastAttemptAt => $composableBuilder(
    column: $table.lastAttemptAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$SyncQueueTableAnnotationComposer
    extends Composer<_$AppDatabase, $SyncQueueTable> {
  $$SyncQueueTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get operationId => $composableBuilder(
    column: $table.operationId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get resourceType => $composableBuilder(
    column: $table.resourceType,
    builder: (column) => column,
  );

  GeneratedColumn<String> get resourceId => $composableBuilder(
    column: $table.resourceId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get operation =>
      $composableBuilder(column: $table.operation, builder: (column) => column);

  GeneratedColumn<int> get resourceVersion => $composableBuilder(
    column: $table.resourceVersion,
    builder: (column) => column,
  );

  GeneratedColumn<String> get payload =>
      $composableBuilder(column: $table.payload, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<int> get retryCount => $composableBuilder(
    column: $table.retryCount,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get lastAttemptAt => $composableBuilder(
    column: $table.lastAttemptAt,
    builder: (column) => column,
  );

  GeneratedColumnWithTypeConverter<SyncQueueStatus, int> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);
}

class $$SyncQueueTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $SyncQueueTable,
          SyncQueueData,
          $$SyncQueueTableFilterComposer,
          $$SyncQueueTableOrderingComposer,
          $$SyncQueueTableAnnotationComposer,
          $$SyncQueueTableCreateCompanionBuilder,
          $$SyncQueueTableUpdateCompanionBuilder,
          (
            SyncQueueData,
            BaseReferences<_$AppDatabase, $SyncQueueTable, SyncQueueData>,
          ),
          SyncQueueData,
          PrefetchHooks Function()
        > {
  $$SyncQueueTableTableManager(_$AppDatabase db, $SyncQueueTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SyncQueueTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SyncQueueTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SyncQueueTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> operationId = const Value.absent(),
                Value<String> resourceType = const Value.absent(),
                Value<String> resourceId = const Value.absent(),
                Value<String> operation = const Value.absent(),
                Value<int> resourceVersion = const Value.absent(),
                Value<String> payload = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<int> retryCount = const Value.absent(),
                Value<DateTime?> lastAttemptAt = const Value.absent(),
                Value<SyncQueueStatus> status = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => SyncQueueCompanion(
                id: id,
                operationId: operationId,
                resourceType: resourceType,
                resourceId: resourceId,
                operation: operation,
                resourceVersion: resourceVersion,
                payload: payload,
                createdAt: createdAt,
                retryCount: retryCount,
                lastAttemptAt: lastAttemptAt,
                status: status,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String operationId,
                required String resourceType,
                required String resourceId,
                required String operation,
                Value<int> resourceVersion = const Value.absent(),
                required String payload,
                Value<DateTime> createdAt = const Value.absent(),
                Value<int> retryCount = const Value.absent(),
                Value<DateTime?> lastAttemptAt = const Value.absent(),
                Value<SyncQueueStatus> status = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => SyncQueueCompanion.insert(
                id: id,
                operationId: operationId,
                resourceType: resourceType,
                resourceId: resourceId,
                operation: operation,
                resourceVersion: resourceVersion,
                payload: payload,
                createdAt: createdAt,
                retryCount: retryCount,
                lastAttemptAt: lastAttemptAt,
                status: status,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$SyncQueueTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $SyncQueueTable,
      SyncQueueData,
      $$SyncQueueTableFilterComposer,
      $$SyncQueueTableOrderingComposer,
      $$SyncQueueTableAnnotationComposer,
      $$SyncQueueTableCreateCompanionBuilder,
      $$SyncQueueTableUpdateCompanionBuilder,
      (
        SyncQueueData,
        BaseReferences<_$AppDatabase, $SyncQueueTable, SyncQueueData>,
      ),
      SyncQueueData,
      PrefetchHooks Function()
    >;
typedef $$ProjectsTableCreateCompanionBuilder =
    ProjectsCompanion Function({
      required String id,
      required String name,
      Value<String?> authorName,
      Value<String?> genre,
      Value<String?> themeColor,
      Value<String?> coverImage,
      Value<int?> targetWordCount,
      Value<String?> accentColor,
      Value<String?> fontPair,
      Value<String?> bookSeries,
      Value<int?> volume,
      Value<String?> publisher,
      Value<String?> copyright,
      Value<String?> language,
      Value<int> version,
      required DateTime createdAt,
      required DateTime updatedAt,
      Value<int> rowid,
    });
typedef $$ProjectsTableUpdateCompanionBuilder =
    ProjectsCompanion Function({
      Value<String> id,
      Value<String> name,
      Value<String?> authorName,
      Value<String?> genre,
      Value<String?> themeColor,
      Value<String?> coverImage,
      Value<int?> targetWordCount,
      Value<String?> accentColor,
      Value<String?> fontPair,
      Value<String?> bookSeries,
      Value<int?> volume,
      Value<String?> publisher,
      Value<String?> copyright,
      Value<String?> language,
      Value<int> version,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

final class $$ProjectsTableReferences
    extends BaseReferences<_$AppDatabase, $ProjectsTable, Project> {
  $$ProjectsTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static MultiTypedResultKey<$StoryEntitiesTable, List<StoryEntity>>
  _storyEntitiesRefsTable(_$AppDatabase db) => MultiTypedResultKey.fromTable(
    db.storyEntities,
    aliasName: 'projects__id__story_entities__project_id',
  );

  $$StoryEntitiesTableProcessedTableManager get storyEntitiesRefs {
    final manager = $$StoryEntitiesTableTableManager(
      $_db,
      $_db.storyEntities,
    ).filter((f) => f.projectId.id.sqlEquals($_itemColumn<String>('id')!));

    final cache = $_typedResult.readTableOrNull(_storyEntitiesRefsTable($_db));
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }

  static MultiTypedResultKey<
    $EntityRelationshipsTable,
    List<EntityRelationship>
  >
  _entityRelationshipsRefsTable(_$AppDatabase db) =>
      MultiTypedResultKey.fromTable(
        db.entityRelationships,
        aliasName: 'projects__id__entity_relationships__project_id',
      );

  $$EntityRelationshipsTableProcessedTableManager get entityRelationshipsRefs {
    final manager = $$EntityRelationshipsTableTableManager(
      $_db,
      $_db.entityRelationships,
    ).filter((f) => f.projectId.id.sqlEquals($_itemColumn<String>('id')!));

    final cache = $_typedResult.readTableOrNull(
      _entityRelationshipsRefsTable($_db),
    );
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }
}

class $$ProjectsTableFilterComposer
    extends Composer<_$AppDatabase, $ProjectsTable> {
  $$ProjectsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get authorName => $composableBuilder(
    column: $table.authorName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get genre => $composableBuilder(
    column: $table.genre,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get themeColor => $composableBuilder(
    column: $table.themeColor,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get coverImage => $composableBuilder(
    column: $table.coverImage,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get targetWordCount => $composableBuilder(
    column: $table.targetWordCount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get accentColor => $composableBuilder(
    column: $table.accentColor,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get fontPair => $composableBuilder(
    column: $table.fontPair,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get bookSeries => $composableBuilder(
    column: $table.bookSeries,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get volume => $composableBuilder(
    column: $table.volume,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get publisher => $composableBuilder(
    column: $table.publisher,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get copyright => $composableBuilder(
    column: $table.copyright,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get language => $composableBuilder(
    column: $table.language,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get version => $composableBuilder(
    column: $table.version,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );

  Expression<bool> storyEntitiesRefs(
    Expression<bool> Function($$StoryEntitiesTableFilterComposer f) f,
  ) {
    final $$StoryEntitiesTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.storyEntities,
      getReferencedColumn: (t) => t.projectId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$StoryEntitiesTableFilterComposer(
            $db: $db,
            $table: $db.storyEntities,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }

  Expression<bool> entityRelationshipsRefs(
    Expression<bool> Function($$EntityRelationshipsTableFilterComposer f) f,
  ) {
    final $$EntityRelationshipsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.entityRelationships,
      getReferencedColumn: (t) => t.projectId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$EntityRelationshipsTableFilterComposer(
            $db: $db,
            $table: $db.entityRelationships,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }
}

class $$ProjectsTableOrderingComposer
    extends Composer<_$AppDatabase, $ProjectsTable> {
  $$ProjectsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get authorName => $composableBuilder(
    column: $table.authorName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get genre => $composableBuilder(
    column: $table.genre,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get themeColor => $composableBuilder(
    column: $table.themeColor,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get coverImage => $composableBuilder(
    column: $table.coverImage,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get targetWordCount => $composableBuilder(
    column: $table.targetWordCount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get accentColor => $composableBuilder(
    column: $table.accentColor,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get fontPair => $composableBuilder(
    column: $table.fontPair,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get bookSeries => $composableBuilder(
    column: $table.bookSeries,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get volume => $composableBuilder(
    column: $table.volume,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get publisher => $composableBuilder(
    column: $table.publisher,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get copyright => $composableBuilder(
    column: $table.copyright,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get language => $composableBuilder(
    column: $table.language,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get version => $composableBuilder(
    column: $table.version,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$ProjectsTableAnnotationComposer
    extends Composer<_$AppDatabase, $ProjectsTable> {
  $$ProjectsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get authorName => $composableBuilder(
    column: $table.authorName,
    builder: (column) => column,
  );

  GeneratedColumn<String> get genre =>
      $composableBuilder(column: $table.genre, builder: (column) => column);

  GeneratedColumn<String> get themeColor => $composableBuilder(
    column: $table.themeColor,
    builder: (column) => column,
  );

  GeneratedColumn<String> get coverImage => $composableBuilder(
    column: $table.coverImage,
    builder: (column) => column,
  );

  GeneratedColumn<int> get targetWordCount => $composableBuilder(
    column: $table.targetWordCount,
    builder: (column) => column,
  );

  GeneratedColumn<String> get accentColor => $composableBuilder(
    column: $table.accentColor,
    builder: (column) => column,
  );

  GeneratedColumn<String> get fontPair =>
      $composableBuilder(column: $table.fontPair, builder: (column) => column);

  GeneratedColumn<String> get bookSeries => $composableBuilder(
    column: $table.bookSeries,
    builder: (column) => column,
  );

  GeneratedColumn<int> get volume =>
      $composableBuilder(column: $table.volume, builder: (column) => column);

  GeneratedColumn<String> get publisher =>
      $composableBuilder(column: $table.publisher, builder: (column) => column);

  GeneratedColumn<String> get copyright =>
      $composableBuilder(column: $table.copyright, builder: (column) => column);

  GeneratedColumn<String> get language =>
      $composableBuilder(column: $table.language, builder: (column) => column);

  GeneratedColumn<int> get version =>
      $composableBuilder(column: $table.version, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  Expression<T> storyEntitiesRefs<T extends Object>(
    Expression<T> Function($$StoryEntitiesTableAnnotationComposer a) f,
  ) {
    final $$StoryEntitiesTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.storyEntities,
      getReferencedColumn: (t) => t.projectId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$StoryEntitiesTableAnnotationComposer(
            $db: $db,
            $table: $db.storyEntities,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }

  Expression<T> entityRelationshipsRefs<T extends Object>(
    Expression<T> Function($$EntityRelationshipsTableAnnotationComposer a) f,
  ) {
    final $$EntityRelationshipsTableAnnotationComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.id,
          referencedTable: $db.entityRelationships,
          getReferencedColumn: (t) => t.projectId,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => $$EntityRelationshipsTableAnnotationComposer(
                $db: $db,
                $table: $db.entityRelationships,
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return f(composer);
  }
}

class $$ProjectsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $ProjectsTable,
          Project,
          $$ProjectsTableFilterComposer,
          $$ProjectsTableOrderingComposer,
          $$ProjectsTableAnnotationComposer,
          $$ProjectsTableCreateCompanionBuilder,
          $$ProjectsTableUpdateCompanionBuilder,
          (Project, $$ProjectsTableReferences),
          Project,
          PrefetchHooks Function({
            bool storyEntitiesRefs,
            bool entityRelationshipsRefs,
          })
        > {
  $$ProjectsTableTableManager(_$AppDatabase db, $ProjectsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$ProjectsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$ProjectsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$ProjectsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> name = const Value.absent(),
                Value<String?> authorName = const Value.absent(),
                Value<String?> genre = const Value.absent(),
                Value<String?> themeColor = const Value.absent(),
                Value<String?> coverImage = const Value.absent(),
                Value<int?> targetWordCount = const Value.absent(),
                Value<String?> accentColor = const Value.absent(),
                Value<String?> fontPair = const Value.absent(),
                Value<String?> bookSeries = const Value.absent(),
                Value<int?> volume = const Value.absent(),
                Value<String?> publisher = const Value.absent(),
                Value<String?> copyright = const Value.absent(),
                Value<String?> language = const Value.absent(),
                Value<int> version = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => ProjectsCompanion(
                id: id,
                name: name,
                authorName: authorName,
                genre: genre,
                themeColor: themeColor,
                coverImage: coverImage,
                targetWordCount: targetWordCount,
                accentColor: accentColor,
                fontPair: fontPair,
                bookSeries: bookSeries,
                volume: volume,
                publisher: publisher,
                copyright: copyright,
                language: language,
                version: version,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String name,
                Value<String?> authorName = const Value.absent(),
                Value<String?> genre = const Value.absent(),
                Value<String?> themeColor = const Value.absent(),
                Value<String?> coverImage = const Value.absent(),
                Value<int?> targetWordCount = const Value.absent(),
                Value<String?> accentColor = const Value.absent(),
                Value<String?> fontPair = const Value.absent(),
                Value<String?> bookSeries = const Value.absent(),
                Value<int?> volume = const Value.absent(),
                Value<String?> publisher = const Value.absent(),
                Value<String?> copyright = const Value.absent(),
                Value<String?> language = const Value.absent(),
                Value<int> version = const Value.absent(),
                required DateTime createdAt,
                required DateTime updatedAt,
                Value<int> rowid = const Value.absent(),
              }) => ProjectsCompanion.insert(
                id: id,
                name: name,
                authorName: authorName,
                genre: genre,
                themeColor: themeColor,
                coverImage: coverImage,
                targetWordCount: targetWordCount,
                accentColor: accentColor,
                fontPair: fontPair,
                bookSeries: bookSeries,
                volume: volume,
                publisher: publisher,
                copyright: copyright,
                language: language,
                version: version,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable(table),
                  $$ProjectsTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback:
              ({storyEntitiesRefs = false, entityRelationshipsRefs = false}) {
                return PrefetchHooks(
                  db: db,
                  explicitlyWatchedTables: [
                    if (storyEntitiesRefs) db.storyEntities,
                    if (entityRelationshipsRefs) db.entityRelationships,
                  ],
                  addJoins: null,
                  getPrefetchedDataCallback: (items) async {
                    return [
                      if (storyEntitiesRefs)
                        await $_getPrefetchedData<
                          Project,
                          $ProjectsTable,
                          StoryEntity
                        >(
                          currentTable: table,
                          referencedTable: $$ProjectsTableReferences
                              ._storyEntitiesRefsTable(db),
                          managerFromTypedResult: (p0) =>
                              $$ProjectsTableReferences(
                                db,
                                table,
                                p0,
                              ).storyEntitiesRefs,
                          referencedItemsForCurrentItem:
                              (item, referencedItems) => referencedItems.where(
                                (e) => e.projectId == item.id,
                              ),
                          typedResults: items,
                        ),
                      if (entityRelationshipsRefs)
                        await $_getPrefetchedData<
                          Project,
                          $ProjectsTable,
                          EntityRelationship
                        >(
                          currentTable: table,
                          referencedTable: $$ProjectsTableReferences
                              ._entityRelationshipsRefsTable(db),
                          managerFromTypedResult: (p0) =>
                              $$ProjectsTableReferences(
                                db,
                                table,
                                p0,
                              ).entityRelationshipsRefs,
                          referencedItemsForCurrentItem:
                              (item, referencedItems) => referencedItems.where(
                                (e) => e.projectId == item.id,
                              ),
                          typedResults: items,
                        ),
                    ];
                  },
                );
              },
        ),
      );
}

typedef $$ProjectsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $ProjectsTable,
      Project,
      $$ProjectsTableFilterComposer,
      $$ProjectsTableOrderingComposer,
      $$ProjectsTableAnnotationComposer,
      $$ProjectsTableCreateCompanionBuilder,
      $$ProjectsTableUpdateCompanionBuilder,
      (Project, $$ProjectsTableReferences),
      Project,
      PrefetchHooks Function({
        bool storyEntitiesRefs,
        bool entityRelationshipsRefs,
      })
    >;
typedef $$StoryEntitiesTableCreateCompanionBuilder =
    StoryEntitiesCompanion Function({
      required String id,
      required String projectId,
      required String type,
      Value<String?> templateId,
      required String title,
      Value<String?> description,
      Value<String?> imageSource,
      Value<String?> imagePath,
      Value<String?> thumbnailPath,
      Value<String?> metadataJson,
      Value<String?> aiSummary,
      Value<String?> embeddingVersion,
      Value<int> connectionCount,
      Value<int> sceneAppearances,
      Value<int> importanceScore,
      Value<int> version,
      Value<String?> updatedBy,
      required DateTime createdAt,
      required DateTime updatedAt,
      Value<int> rowid,
    });
typedef $$StoryEntitiesTableUpdateCompanionBuilder =
    StoryEntitiesCompanion Function({
      Value<String> id,
      Value<String> projectId,
      Value<String> type,
      Value<String?> templateId,
      Value<String> title,
      Value<String?> description,
      Value<String?> imageSource,
      Value<String?> imagePath,
      Value<String?> thumbnailPath,
      Value<String?> metadataJson,
      Value<String?> aiSummary,
      Value<String?> embeddingVersion,
      Value<int> connectionCount,
      Value<int> sceneAppearances,
      Value<int> importanceScore,
      Value<int> version,
      Value<String?> updatedBy,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

final class $$StoryEntitiesTableReferences
    extends BaseReferences<_$AppDatabase, $StoryEntitiesTable, StoryEntity> {
  $$StoryEntitiesTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static $ProjectsTable _projectIdTable(_$AppDatabase db) =>
      db.projects.createAlias('story_entities__project_id__projects__id');

  $$ProjectsTableProcessedTableManager get projectId {
    final $_column = $_itemColumn<String>('project_id')!;

    final manager = $$ProjectsTableTableManager(
      $_db,
      $_db.projects,
    ).filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_projectIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }

  static MultiTypedResultKey<
    $EntityRelationshipsTable,
    List<EntityRelationship>
  >
  _sourceEntityRelationshipsTable(_$AppDatabase db) =>
      MultiTypedResultKey.fromTable(
        db.entityRelationships,
        aliasName: 'story_entities__id__entity_relationships__source_entity_id',
      );

  $$EntityRelationshipsTableProcessedTableManager
  get sourceEntityRelationships {
    final manager = $$EntityRelationshipsTableTableManager(
      $_db,
      $_db.entityRelationships,
    ).filter((f) => f.sourceEntityId.id.sqlEquals($_itemColumn<String>('id')!));

    final cache = $_typedResult.readTableOrNull(
      _sourceEntityRelationshipsTable($_db),
    );
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }

  static MultiTypedResultKey<
    $EntityRelationshipsTable,
    List<EntityRelationship>
  >
  _targetEntityRelationshipsTable(_$AppDatabase db) =>
      MultiTypedResultKey.fromTable(
        db.entityRelationships,
        aliasName: 'story_entities__id__entity_relationships__target_entity_id',
      );

  $$EntityRelationshipsTableProcessedTableManager
  get targetEntityRelationships {
    final manager = $$EntityRelationshipsTableTableManager(
      $_db,
      $_db.entityRelationships,
    ).filter((f) => f.targetEntityId.id.sqlEquals($_itemColumn<String>('id')!));

    final cache = $_typedResult.readTableOrNull(
      _targetEntityRelationshipsTable($_db),
    );
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }
}

class $$StoryEntitiesTableFilterComposer
    extends Composer<_$AppDatabase, $StoryEntitiesTable> {
  $$StoryEntitiesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get type => $composableBuilder(
    column: $table.type,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get templateId => $composableBuilder(
    column: $table.templateId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get imageSource => $composableBuilder(
    column: $table.imageSource,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get imagePath => $composableBuilder(
    column: $table.imagePath,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get thumbnailPath => $composableBuilder(
    column: $table.thumbnailPath,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get metadataJson => $composableBuilder(
    column: $table.metadataJson,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get aiSummary => $composableBuilder(
    column: $table.aiSummary,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get embeddingVersion => $composableBuilder(
    column: $table.embeddingVersion,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get connectionCount => $composableBuilder(
    column: $table.connectionCount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get sceneAppearances => $composableBuilder(
    column: $table.sceneAppearances,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get importanceScore => $composableBuilder(
    column: $table.importanceScore,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get version => $composableBuilder(
    column: $table.version,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get updatedBy => $composableBuilder(
    column: $table.updatedBy,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );

  $$ProjectsTableFilterComposer get projectId {
    final $$ProjectsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.projectId,
      referencedTable: $db.projects,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$ProjectsTableFilterComposer(
            $db: $db,
            $table: $db.projects,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }

  Expression<bool> sourceEntityRelationships(
    Expression<bool> Function($$EntityRelationshipsTableFilterComposer f) f,
  ) {
    final $$EntityRelationshipsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.entityRelationships,
      getReferencedColumn: (t) => t.sourceEntityId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$EntityRelationshipsTableFilterComposer(
            $db: $db,
            $table: $db.entityRelationships,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }

  Expression<bool> targetEntityRelationships(
    Expression<bool> Function($$EntityRelationshipsTableFilterComposer f) f,
  ) {
    final $$EntityRelationshipsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.entityRelationships,
      getReferencedColumn: (t) => t.targetEntityId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$EntityRelationshipsTableFilterComposer(
            $db: $db,
            $table: $db.entityRelationships,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }
}

class $$StoryEntitiesTableOrderingComposer
    extends Composer<_$AppDatabase, $StoryEntitiesTable> {
  $$StoryEntitiesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get type => $composableBuilder(
    column: $table.type,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get templateId => $composableBuilder(
    column: $table.templateId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get imageSource => $composableBuilder(
    column: $table.imageSource,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get imagePath => $composableBuilder(
    column: $table.imagePath,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get thumbnailPath => $composableBuilder(
    column: $table.thumbnailPath,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get metadataJson => $composableBuilder(
    column: $table.metadataJson,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get aiSummary => $composableBuilder(
    column: $table.aiSummary,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get embeddingVersion => $composableBuilder(
    column: $table.embeddingVersion,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get connectionCount => $composableBuilder(
    column: $table.connectionCount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get sceneAppearances => $composableBuilder(
    column: $table.sceneAppearances,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get importanceScore => $composableBuilder(
    column: $table.importanceScore,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get version => $composableBuilder(
    column: $table.version,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get updatedBy => $composableBuilder(
    column: $table.updatedBy,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );

  $$ProjectsTableOrderingComposer get projectId {
    final $$ProjectsTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.projectId,
      referencedTable: $db.projects,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$ProjectsTableOrderingComposer(
            $db: $db,
            $table: $db.projects,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$StoryEntitiesTableAnnotationComposer
    extends Composer<_$AppDatabase, $StoryEntitiesTable> {
  $$StoryEntitiesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get type =>
      $composableBuilder(column: $table.type, builder: (column) => column);

  GeneratedColumn<String> get templateId => $composableBuilder(
    column: $table.templateId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get title =>
      $composableBuilder(column: $table.title, builder: (column) => column);

  GeneratedColumn<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => column,
  );

  GeneratedColumn<String> get imageSource => $composableBuilder(
    column: $table.imageSource,
    builder: (column) => column,
  );

  GeneratedColumn<String> get imagePath =>
      $composableBuilder(column: $table.imagePath, builder: (column) => column);

  GeneratedColumn<String> get thumbnailPath => $composableBuilder(
    column: $table.thumbnailPath,
    builder: (column) => column,
  );

  GeneratedColumn<String> get metadataJson => $composableBuilder(
    column: $table.metadataJson,
    builder: (column) => column,
  );

  GeneratedColumn<String> get aiSummary =>
      $composableBuilder(column: $table.aiSummary, builder: (column) => column);

  GeneratedColumn<String> get embeddingVersion => $composableBuilder(
    column: $table.embeddingVersion,
    builder: (column) => column,
  );

  GeneratedColumn<int> get connectionCount => $composableBuilder(
    column: $table.connectionCount,
    builder: (column) => column,
  );

  GeneratedColumn<int> get sceneAppearances => $composableBuilder(
    column: $table.sceneAppearances,
    builder: (column) => column,
  );

  GeneratedColumn<int> get importanceScore => $composableBuilder(
    column: $table.importanceScore,
    builder: (column) => column,
  );

  GeneratedColumn<int> get version =>
      $composableBuilder(column: $table.version, builder: (column) => column);

  GeneratedColumn<String> get updatedBy =>
      $composableBuilder(column: $table.updatedBy, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  $$ProjectsTableAnnotationComposer get projectId {
    final $$ProjectsTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.projectId,
      referencedTable: $db.projects,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$ProjectsTableAnnotationComposer(
            $db: $db,
            $table: $db.projects,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }

  Expression<T> sourceEntityRelationships<T extends Object>(
    Expression<T> Function($$EntityRelationshipsTableAnnotationComposer a) f,
  ) {
    final $$EntityRelationshipsTableAnnotationComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.id,
          referencedTable: $db.entityRelationships,
          getReferencedColumn: (t) => t.sourceEntityId,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => $$EntityRelationshipsTableAnnotationComposer(
                $db: $db,
                $table: $db.entityRelationships,
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return f(composer);
  }

  Expression<T> targetEntityRelationships<T extends Object>(
    Expression<T> Function($$EntityRelationshipsTableAnnotationComposer a) f,
  ) {
    final $$EntityRelationshipsTableAnnotationComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.id,
          referencedTable: $db.entityRelationships,
          getReferencedColumn: (t) => t.targetEntityId,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => $$EntityRelationshipsTableAnnotationComposer(
                $db: $db,
                $table: $db.entityRelationships,
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return f(composer);
  }
}

class $$StoryEntitiesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $StoryEntitiesTable,
          StoryEntity,
          $$StoryEntitiesTableFilterComposer,
          $$StoryEntitiesTableOrderingComposer,
          $$StoryEntitiesTableAnnotationComposer,
          $$StoryEntitiesTableCreateCompanionBuilder,
          $$StoryEntitiesTableUpdateCompanionBuilder,
          (StoryEntity, $$StoryEntitiesTableReferences),
          StoryEntity,
          PrefetchHooks Function({
            bool projectId,
            bool sourceEntityRelationships,
            bool targetEntityRelationships,
          })
        > {
  $$StoryEntitiesTableTableManager(_$AppDatabase db, $StoryEntitiesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$StoryEntitiesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$StoryEntitiesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$StoryEntitiesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> projectId = const Value.absent(),
                Value<String> type = const Value.absent(),
                Value<String?> templateId = const Value.absent(),
                Value<String> title = const Value.absent(),
                Value<String?> description = const Value.absent(),
                Value<String?> imageSource = const Value.absent(),
                Value<String?> imagePath = const Value.absent(),
                Value<String?> thumbnailPath = const Value.absent(),
                Value<String?> metadataJson = const Value.absent(),
                Value<String?> aiSummary = const Value.absent(),
                Value<String?> embeddingVersion = const Value.absent(),
                Value<int> connectionCount = const Value.absent(),
                Value<int> sceneAppearances = const Value.absent(),
                Value<int> importanceScore = const Value.absent(),
                Value<int> version = const Value.absent(),
                Value<String?> updatedBy = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => StoryEntitiesCompanion(
                id: id,
                projectId: projectId,
                type: type,
                templateId: templateId,
                title: title,
                description: description,
                imageSource: imageSource,
                imagePath: imagePath,
                thumbnailPath: thumbnailPath,
                metadataJson: metadataJson,
                aiSummary: aiSummary,
                embeddingVersion: embeddingVersion,
                connectionCount: connectionCount,
                sceneAppearances: sceneAppearances,
                importanceScore: importanceScore,
                version: version,
                updatedBy: updatedBy,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String projectId,
                required String type,
                Value<String?> templateId = const Value.absent(),
                required String title,
                Value<String?> description = const Value.absent(),
                Value<String?> imageSource = const Value.absent(),
                Value<String?> imagePath = const Value.absent(),
                Value<String?> thumbnailPath = const Value.absent(),
                Value<String?> metadataJson = const Value.absent(),
                Value<String?> aiSummary = const Value.absent(),
                Value<String?> embeddingVersion = const Value.absent(),
                Value<int> connectionCount = const Value.absent(),
                Value<int> sceneAppearances = const Value.absent(),
                Value<int> importanceScore = const Value.absent(),
                Value<int> version = const Value.absent(),
                Value<String?> updatedBy = const Value.absent(),
                required DateTime createdAt,
                required DateTime updatedAt,
                Value<int> rowid = const Value.absent(),
              }) => StoryEntitiesCompanion.insert(
                id: id,
                projectId: projectId,
                type: type,
                templateId: templateId,
                title: title,
                description: description,
                imageSource: imageSource,
                imagePath: imagePath,
                thumbnailPath: thumbnailPath,
                metadataJson: metadataJson,
                aiSummary: aiSummary,
                embeddingVersion: embeddingVersion,
                connectionCount: connectionCount,
                sceneAppearances: sceneAppearances,
                importanceScore: importanceScore,
                version: version,
                updatedBy: updatedBy,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable(table),
                  $$StoryEntitiesTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback:
              ({
                projectId = false,
                sourceEntityRelationships = false,
                targetEntityRelationships = false,
              }) {
                return PrefetchHooks(
                  db: db,
                  explicitlyWatchedTables: [
                    if (sourceEntityRelationships) db.entityRelationships,
                    if (targetEntityRelationships) db.entityRelationships,
                  ],
                  addJoins:
                      <
                        T extends TableManagerState<
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic
                        >
                      >(state) {
                        if (projectId) {
                          state =
                              state.withJoin(
                                    currentTable: table,
                                    currentColumn: table.projectId,
                                    referencedTable:
                                        $$StoryEntitiesTableReferences
                                            ._projectIdTable(db),
                                    referencedColumn:
                                        $$StoryEntitiesTableReferences
                                            ._projectIdTable(db)
                                            .id,
                                  )
                                  as T;
                        }

                        return state;
                      },
                  getPrefetchedDataCallback: (items) async {
                    return [
                      if (sourceEntityRelationships)
                        await $_getPrefetchedData<
                          StoryEntity,
                          $StoryEntitiesTable,
                          EntityRelationship
                        >(
                          currentTable: table,
                          referencedTable: $$StoryEntitiesTableReferences
                              ._sourceEntityRelationshipsTable(db),
                          managerFromTypedResult: (p0) =>
                              $$StoryEntitiesTableReferences(
                                db,
                                table,
                                p0,
                              ).sourceEntityRelationships,
                          referencedItemsForCurrentItem:
                              (item, referencedItems) => referencedItems.where(
                                (e) => e.sourceEntityId == item.id,
                              ),
                          typedResults: items,
                        ),
                      if (targetEntityRelationships)
                        await $_getPrefetchedData<
                          StoryEntity,
                          $StoryEntitiesTable,
                          EntityRelationship
                        >(
                          currentTable: table,
                          referencedTable: $$StoryEntitiesTableReferences
                              ._targetEntityRelationshipsTable(db),
                          managerFromTypedResult: (p0) =>
                              $$StoryEntitiesTableReferences(
                                db,
                                table,
                                p0,
                              ).targetEntityRelationships,
                          referencedItemsForCurrentItem:
                              (item, referencedItems) => referencedItems.where(
                                (e) => e.targetEntityId == item.id,
                              ),
                          typedResults: items,
                        ),
                    ];
                  },
                );
              },
        ),
      );
}

typedef $$StoryEntitiesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $StoryEntitiesTable,
      StoryEntity,
      $$StoryEntitiesTableFilterComposer,
      $$StoryEntitiesTableOrderingComposer,
      $$StoryEntitiesTableAnnotationComposer,
      $$StoryEntitiesTableCreateCompanionBuilder,
      $$StoryEntitiesTableUpdateCompanionBuilder,
      (StoryEntity, $$StoryEntitiesTableReferences),
      StoryEntity,
      PrefetchHooks Function({
        bool projectId,
        bool sourceEntityRelationships,
        bool targetEntityRelationships,
      })
    >;
typedef $$EntityRelationshipsTableCreateCompanionBuilder =
    EntityRelationshipsCompanion Function({
      required String id,
      required String projectId,
      required String sourceEntityId,
      required String targetEntityId,
      required String relationshipType,
      Value<int> strength,
      Value<String> direction,
      Value<String?> description,
      Value<String?> notes,
      Value<String?> metadataJson,
      Value<int> version,
      Value<String?> updatedBy,
      Value<int> rowid,
    });
typedef $$EntityRelationshipsTableUpdateCompanionBuilder =
    EntityRelationshipsCompanion Function({
      Value<String> id,
      Value<String> projectId,
      Value<String> sourceEntityId,
      Value<String> targetEntityId,
      Value<String> relationshipType,
      Value<int> strength,
      Value<String> direction,
      Value<String?> description,
      Value<String?> notes,
      Value<String?> metadataJson,
      Value<int> version,
      Value<String?> updatedBy,
      Value<int> rowid,
    });

final class $$EntityRelationshipsTableReferences
    extends
        BaseReferences<
          _$AppDatabase,
          $EntityRelationshipsTable,
          EntityRelationship
        > {
  $$EntityRelationshipsTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static $ProjectsTable _projectIdTable(_$AppDatabase db) =>
      db.projects.createAlias('entity_relationships__project_id__projects__id');

  $$ProjectsTableProcessedTableManager get projectId {
    final $_column = $_itemColumn<String>('project_id')!;

    final manager = $$ProjectsTableTableManager(
      $_db,
      $_db.projects,
    ).filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_projectIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }

  static $StoryEntitiesTable _sourceEntityIdTable(_$AppDatabase db) =>
      db.storyEntities.createAlias(
        'entity_relationships__source_entity_id__story_entities__id',
      );

  $$StoryEntitiesTableProcessedTableManager get sourceEntityId {
    final $_column = $_itemColumn<String>('source_entity_id')!;

    final manager = $$StoryEntitiesTableTableManager(
      $_db,
      $_db.storyEntities,
    ).filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_sourceEntityIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }

  static $StoryEntitiesTable _targetEntityIdTable(_$AppDatabase db) =>
      db.storyEntities.createAlias(
        'entity_relationships__target_entity_id__story_entities__id',
      );

  $$StoryEntitiesTableProcessedTableManager get targetEntityId {
    final $_column = $_itemColumn<String>('target_entity_id')!;

    final manager = $$StoryEntitiesTableTableManager(
      $_db,
      $_db.storyEntities,
    ).filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_targetEntityIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$EntityRelationshipsTableFilterComposer
    extends Composer<_$AppDatabase, $EntityRelationshipsTable> {
  $$EntityRelationshipsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get relationshipType => $composableBuilder(
    column: $table.relationshipType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get strength => $composableBuilder(
    column: $table.strength,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get direction => $composableBuilder(
    column: $table.direction,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get metadataJson => $composableBuilder(
    column: $table.metadataJson,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get version => $composableBuilder(
    column: $table.version,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get updatedBy => $composableBuilder(
    column: $table.updatedBy,
    builder: (column) => ColumnFilters(column),
  );

  $$ProjectsTableFilterComposer get projectId {
    final $$ProjectsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.projectId,
      referencedTable: $db.projects,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$ProjectsTableFilterComposer(
            $db: $db,
            $table: $db.projects,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }

  $$StoryEntitiesTableFilterComposer get sourceEntityId {
    final $$StoryEntitiesTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.sourceEntityId,
      referencedTable: $db.storyEntities,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$StoryEntitiesTableFilterComposer(
            $db: $db,
            $table: $db.storyEntities,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }

  $$StoryEntitiesTableFilterComposer get targetEntityId {
    final $$StoryEntitiesTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.targetEntityId,
      referencedTable: $db.storyEntities,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$StoryEntitiesTableFilterComposer(
            $db: $db,
            $table: $db.storyEntities,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$EntityRelationshipsTableOrderingComposer
    extends Composer<_$AppDatabase, $EntityRelationshipsTable> {
  $$EntityRelationshipsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get relationshipType => $composableBuilder(
    column: $table.relationshipType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get strength => $composableBuilder(
    column: $table.strength,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get direction => $composableBuilder(
    column: $table.direction,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get metadataJson => $composableBuilder(
    column: $table.metadataJson,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get version => $composableBuilder(
    column: $table.version,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get updatedBy => $composableBuilder(
    column: $table.updatedBy,
    builder: (column) => ColumnOrderings(column),
  );

  $$ProjectsTableOrderingComposer get projectId {
    final $$ProjectsTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.projectId,
      referencedTable: $db.projects,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$ProjectsTableOrderingComposer(
            $db: $db,
            $table: $db.projects,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }

  $$StoryEntitiesTableOrderingComposer get sourceEntityId {
    final $$StoryEntitiesTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.sourceEntityId,
      referencedTable: $db.storyEntities,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$StoryEntitiesTableOrderingComposer(
            $db: $db,
            $table: $db.storyEntities,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }

  $$StoryEntitiesTableOrderingComposer get targetEntityId {
    final $$StoryEntitiesTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.targetEntityId,
      referencedTable: $db.storyEntities,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$StoryEntitiesTableOrderingComposer(
            $db: $db,
            $table: $db.storyEntities,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$EntityRelationshipsTableAnnotationComposer
    extends Composer<_$AppDatabase, $EntityRelationshipsTable> {
  $$EntityRelationshipsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get relationshipType => $composableBuilder(
    column: $table.relationshipType,
    builder: (column) => column,
  );

  GeneratedColumn<int> get strength =>
      $composableBuilder(column: $table.strength, builder: (column) => column);

  GeneratedColumn<String> get direction =>
      $composableBuilder(column: $table.direction, builder: (column) => column);

  GeneratedColumn<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => column,
  );

  GeneratedColumn<String> get notes =>
      $composableBuilder(column: $table.notes, builder: (column) => column);

  GeneratedColumn<String> get metadataJson => $composableBuilder(
    column: $table.metadataJson,
    builder: (column) => column,
  );

  GeneratedColumn<int> get version =>
      $composableBuilder(column: $table.version, builder: (column) => column);

  GeneratedColumn<String> get updatedBy =>
      $composableBuilder(column: $table.updatedBy, builder: (column) => column);

  $$ProjectsTableAnnotationComposer get projectId {
    final $$ProjectsTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.projectId,
      referencedTable: $db.projects,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$ProjectsTableAnnotationComposer(
            $db: $db,
            $table: $db.projects,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }

  $$StoryEntitiesTableAnnotationComposer get sourceEntityId {
    final $$StoryEntitiesTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.sourceEntityId,
      referencedTable: $db.storyEntities,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$StoryEntitiesTableAnnotationComposer(
            $db: $db,
            $table: $db.storyEntities,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }

  $$StoryEntitiesTableAnnotationComposer get targetEntityId {
    final $$StoryEntitiesTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.targetEntityId,
      referencedTable: $db.storyEntities,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$StoryEntitiesTableAnnotationComposer(
            $db: $db,
            $table: $db.storyEntities,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$EntityRelationshipsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $EntityRelationshipsTable,
          EntityRelationship,
          $$EntityRelationshipsTableFilterComposer,
          $$EntityRelationshipsTableOrderingComposer,
          $$EntityRelationshipsTableAnnotationComposer,
          $$EntityRelationshipsTableCreateCompanionBuilder,
          $$EntityRelationshipsTableUpdateCompanionBuilder,
          (EntityRelationship, $$EntityRelationshipsTableReferences),
          EntityRelationship,
          PrefetchHooks Function({
            bool projectId,
            bool sourceEntityId,
            bool targetEntityId,
          })
        > {
  $$EntityRelationshipsTableTableManager(
    _$AppDatabase db,
    $EntityRelationshipsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$EntityRelationshipsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$EntityRelationshipsTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$EntityRelationshipsTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> projectId = const Value.absent(),
                Value<String> sourceEntityId = const Value.absent(),
                Value<String> targetEntityId = const Value.absent(),
                Value<String> relationshipType = const Value.absent(),
                Value<int> strength = const Value.absent(),
                Value<String> direction = const Value.absent(),
                Value<String?> description = const Value.absent(),
                Value<String?> notes = const Value.absent(),
                Value<String?> metadataJson = const Value.absent(),
                Value<int> version = const Value.absent(),
                Value<String?> updatedBy = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => EntityRelationshipsCompanion(
                id: id,
                projectId: projectId,
                sourceEntityId: sourceEntityId,
                targetEntityId: targetEntityId,
                relationshipType: relationshipType,
                strength: strength,
                direction: direction,
                description: description,
                notes: notes,
                metadataJson: metadataJson,
                version: version,
                updatedBy: updatedBy,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String projectId,
                required String sourceEntityId,
                required String targetEntityId,
                required String relationshipType,
                Value<int> strength = const Value.absent(),
                Value<String> direction = const Value.absent(),
                Value<String?> description = const Value.absent(),
                Value<String?> notes = const Value.absent(),
                Value<String?> metadataJson = const Value.absent(),
                Value<int> version = const Value.absent(),
                Value<String?> updatedBy = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => EntityRelationshipsCompanion.insert(
                id: id,
                projectId: projectId,
                sourceEntityId: sourceEntityId,
                targetEntityId: targetEntityId,
                relationshipType: relationshipType,
                strength: strength,
                direction: direction,
                description: description,
                notes: notes,
                metadataJson: metadataJson,
                version: version,
                updatedBy: updatedBy,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable(table),
                  $$EntityRelationshipsTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback:
              ({
                projectId = false,
                sourceEntityId = false,
                targetEntityId = false,
              }) {
                return PrefetchHooks(
                  db: db,
                  explicitlyWatchedTables: [],
                  addJoins:
                      <
                        T extends TableManagerState<
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic
                        >
                      >(state) {
                        if (projectId) {
                          state =
                              state.withJoin(
                                    currentTable: table,
                                    currentColumn: table.projectId,
                                    referencedTable:
                                        $$EntityRelationshipsTableReferences
                                            ._projectIdTable(db),
                                    referencedColumn:
                                        $$EntityRelationshipsTableReferences
                                            ._projectIdTable(db)
                                            .id,
                                  )
                                  as T;
                        }
                        if (sourceEntityId) {
                          state =
                              state.withJoin(
                                    currentTable: table,
                                    currentColumn: table.sourceEntityId,
                                    referencedTable:
                                        $$EntityRelationshipsTableReferences
                                            ._sourceEntityIdTable(db),
                                    referencedColumn:
                                        $$EntityRelationshipsTableReferences
                                            ._sourceEntityIdTable(db)
                                            .id,
                                  )
                                  as T;
                        }
                        if (targetEntityId) {
                          state =
                              state.withJoin(
                                    currentTable: table,
                                    currentColumn: table.targetEntityId,
                                    referencedTable:
                                        $$EntityRelationshipsTableReferences
                                            ._targetEntityIdTable(db),
                                    referencedColumn:
                                        $$EntityRelationshipsTableReferences
                                            ._targetEntityIdTable(db)
                                            .id,
                                  )
                                  as T;
                        }

                        return state;
                      },
                  getPrefetchedDataCallback: (items) async {
                    return [];
                  },
                );
              },
        ),
      );
}

typedef $$EntityRelationshipsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $EntityRelationshipsTable,
      EntityRelationship,
      $$EntityRelationshipsTableFilterComposer,
      $$EntityRelationshipsTableOrderingComposer,
      $$EntityRelationshipsTableAnnotationComposer,
      $$EntityRelationshipsTableCreateCompanionBuilder,
      $$EntityRelationshipsTableUpdateCompanionBuilder,
      (EntityRelationship, $$EntityRelationshipsTableReferences),
      EntityRelationship,
      PrefetchHooks Function({
        bool projectId,
        bool sourceEntityId,
        bool targetEntityId,
      })
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$DraftsTableTableManager get drafts =>
      $$DraftsTableTableManager(_db, _db.drafts);
  $$SyncQueueTableTableManager get syncQueue =>
      $$SyncQueueTableTableManager(_db, _db.syncQueue);
  $$ProjectsTableTableManager get projects =>
      $$ProjectsTableTableManager(_db, _db.projects);
  $$StoryEntitiesTableTableManager get storyEntities =>
      $$StoryEntitiesTableTableManager(_db, _db.storyEntities);
  $$EntityRelationshipsTableTableManager get entityRelationships =>
      $$EntityRelationshipsTableTableManager(_db, _db.entityRelationships);
}
