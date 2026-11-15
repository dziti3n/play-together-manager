import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../models/account.dart';
import '../services/storage_service.dart';
import '../theme/app_theme.dart';
import 'detail_screen.dart';

class DashboardScreen extends StatefulWidget {
  final bool isDarkMode;
  final VoidCallback onToggleTheme;

  const DashboardScreen({
    super.key,
    required this.isDarkMode,
    required this.onToggleTheme,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<Account> _accounts = [];
  bool _isLoading = true;

  // Filters
  String _search = '';
  String _statusFilter = 'all';
  String _numericField = 'none';
  int? _numericValue;

  // Column toggles
  bool _showCharacter = true;
  bool _showMoney = true;
  bool _showTickets = true;
  bool _showInventory = true;
  bool _showFarm = true;
  bool _showEvents = true;

  final NumberFormat _numFormat = NumberFormat('#,###', 'vi_VN');

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final loaded = await StorageService.loadAccounts();
    setState(() {
      _accounts = loaded;
      _isLoading = false;
    });
  }

  Future<void> _saveData() async {
    await StorageService.saveAccounts(_accounts);
  }

  List<Account> get _filteredAccounts {
    return _accounts.where((acc) {
      if (_search.isNotEmpty) {
        final q = _search.toLowerCase();
        final matchUser = acc.username.toLowerCase().contains(q);
        final matchChar = acc.characterName.toLowerCase().contains(q);
        final matchRole = acc.roleId.toLowerCase().contains(q);
        if (!matchUser && !matchChar && !matchRole) return false;
      }

      if (_statusFilter != 'all' && acc.status != _statusFilter) {
        return false;
      }

      if (_numericField != 'none' && _numericValue != null && _numericValue! > 0) {
        if (_numericField == 'gems' && acc.gems < _numericValue!) return false;
        if (_numericField == 'gameBucks' && acc.gameBucks < _numericValue!) return false;
        if (_numericField == 'boxes' && acc.boxes < _numericValue!) return false;
        if (_numericField == 'stars' && acc.stars < _numericValue!) return false;
        if (_numericField == 'farm' && acc.totalFruits < _numericValue!) return false;
      }

      return true;
    }).toList();
  }

  void _showAddAccountDialog() {
    final usernameCtrl = TextEditingController();
    final passwordCtrl = TextEditingController();
    final roleIdCtrl = TextEditingController();
    String status = 'active';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.person_add, color: AppTheme.accentGreen),
              SizedBox(width: 8),
              Text('Thêm Tài Khoản Mới'),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: usernameCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Tên tài khoản / Đăng nhập *',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: passwordCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Mật khẩu (Tùy chọn)',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: roleIdCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Role ID (Mã nhân vật)',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: status,
                  decoration: const InputDecoration(
                    labelText: 'Tình trạng',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'active', child: Text('🟢 Vào được')),
                    DropdownMenuItem(value: 'pending', child: Text('⚪ Chưa kiểm tra')),
                    DropdownMenuItem(value: 'wrong_pw', child: Text('🟡 Sai mật khẩu')),
                    DropdownMenuItem(value: 'banned', child: Text('🔴 Bị khóa')),
                  ],
                  onChanged: (val) {
                    if (val != null) setDialogState(() => status = val);
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Hủy'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.accentGreen),
              onPressed: () {
                if (usernameCtrl.text.trim().isEmpty) return;
                final newAcc = Account(
                  id: 'acc_${DateTime.now().millisecondsSinceEpoch}',
                  username: usernameCtrl.text.trim(),
                  password: passwordCtrl.text.trim(),
                  characterName: usernameCtrl.text.trim(),
                  roleId: roleIdCtrl.text.trim(),
                  status: status,
                  fruits: [
                    FruitItem(id: 'f_1', name: 'Cà rốt', icon: '🥕', quantity: 0),
                    FruitItem(id: 'f_2', name: 'Cà chua', icon: '🍅', quantity: 0),
                    FruitItem(id: 'f_3', name: 'Táo đỏ', icon: '🍎', quantity: 0),
                    FruitItem(id: 'f_4', name: 'Ngô (Bắp)', icon: '🌽', quantity: 0),
                    FruitItem(id: 'f_5', name: 'Dâu tây', icon: '🍓', quantity: 0),
                  ],
                  updatedAt: DateTime.now(),
                );

                setState(() {
                  _accounts.insert(0, newAcc);
                });
                _saveData();
                Navigator.of(ctx).pop();
              },
              child: const Text('Tạo', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  void _showBackupDialog() {
    final jsonText = StorageService.exportToJson(_accounts);
    final importCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.backup, color: AppTheme.accentCyan),
            SizedBox(width: 8),
            Text('Sao Lưu & Chia Sẻ Dữ Liệu'),
          ],
        ),
        content: SizedBox(
          width: 500,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  '1. SAO CHÉP MÃ BACKUP (JSON):',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Gửi đoạn mã này cho bạn bè hoặc lưu vào ghi chú để sao lưu:',
                  style: TextStyle(fontSize: 11, color: Colors.grey),
                ),
                const SizedBox(height: 6),
                ElevatedButton.icon(
                  icon: const Icon(Icons.copy, size: 16),
                  label: const Text('Sao chép toàn bộ dữ liệu'),
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: jsonText));
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Đã sao chép dữ liệu JSON vào Clipboard!')),
                    );
                  },
                ),
                const Divider(height: 32),
                const Text(
                  '2. KHÔI PHỤC / NHẬP DỮ LIỆU TỪ MÃ JSON:',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: importCtrl,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    hintText: 'Dán đoạn mã JSON vào đây...',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 8),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.accentCyan),
                  icon: const Icon(Icons.download, size: 16, color: Colors.white),
                  label: const Text('Nạp Dữ Liệu Này Vào App', style: TextStyle(color: Colors.white)),
                  onPressed: () {
                    final imported = StorageService.importFromJson(importCtrl.text.trim());
                    if (imported != null && imported.isNotEmpty) {
                      setState(() {
                        _accounts = imported;
                      });
                      _saveData();
                      Navigator.of(ctx).pop();
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Đã nạp thành công ${imported.length} tài khoản!')),
                      );
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Mã JSON không hợp lệ!')),
                      );
                    }
                  },
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final activeCount = _accounts.where((a) => a.status == 'active').length;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Colors.orange, Colors.pink]),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'PT',
                style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14),
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'Play Together Manager',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
        actions: [
          // Theme button
          IconButton(
            icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode),
            tooltip: 'Đổi giao diện Sáng/Tối',
            onPressed: widget.onToggleTheme,
          ),
          // Backup button
          IconButton(
            icon: const Icon(Icons.backup_outlined),
            tooltip: 'Sao lưu & Xuất nhập',
            onPressed: _showBackupDialog,
          ),
          const SizedBox(width: 4),
          // Add account
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.accentGreen,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            icon: const Icon(Icons.add, size: 18),
            label: const Text('Thêm tài khoản'),
            onPressed: _showAddAccountDialog,
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top search & Numeric filter
                  Row(
                    children: [
                      // Search input
                      Expanded(
                        flex: 3,
                        child: TextField(
                          decoration: InputDecoration(
                            hintText: 'Tìm tài khoản, tên, Role ID...',
                            prefixIcon: const Icon(Icons.search),
                            isDense: true,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          onChanged: (val) => setState(() => _search = val.trim()),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Numeric dropdown
                      Expanded(
                        flex: 2,
                        child: DropdownButtonFormField<String>(
                          initialValue: _numericField,
                          decoration: InputDecoration(
                            isDense: true,
                            labelText: 'Lọc số',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          items: const [
                            DropdownMenuItem(value: 'none', child: Text('Chọn mục')),
                            DropdownMenuItem(value: 'gems', child: Text('💎 Kim Cương ≥')),
                            DropdownMenuItem(value: 'gameBucks', child: Text('💵 Tiền Sao ≥')),
                            DropdownMenuItem(value: 'boxes', child: Text('📦 Hộp quà ≥')),
                            DropdownMenuItem(value: 'stars', child: Text('⭐ Cấp sao ≥')),
                            DropdownMenuItem(value: 'farm', child: Text('🥕 Kho trái ≥')),
                          ],
                          onChanged: (val) => setState(() => _numericField = val ?? 'none'),
                        ),
                      ),
                      if (_numericField != 'none') ...[
                        const SizedBox(width: 8),
                        SizedBox(
                          width: 90,
                          child: TextField(
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              hintText: 'Số lượng',
                              isDense: true,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            onChanged: (val) => setState(() => _numericValue = int.tryParse(val)),
                          ),
                        ),
                      ],
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Status chips
                  Row(
                    children: [
                      _statusFilterChip('all', 'Tất cả (${_accounts.length})'),
                      const SizedBox(width: 8),
                      _statusFilterChip('active', '🟢 Vào được ($activeCount)'),
                      const SizedBox(width: 8),
                      _statusFilterChip(
                        'banned',
                        '🔴 Bị khóa (${_accounts.where((a) => a.status == 'banned').length})',
                      ),
                      const SizedBox(width: 8),
                      _statusFilterChip(
                        'wrong_pw',
                        '🟡 Sai MK (${_accounts.where((a) => a.status == 'wrong_pw').length})',
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Column toggle pills
                  Row(
                    children: [
                      const Text(
                        'CỘT: ',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey),
                      ),
                      const SizedBox(width: 6),
                      _columnPill('Nhân vật', _showCharacter, () => setState(() => _showCharacter = !_showCharacter)),
                      const SizedBox(width: 6),
                      _columnPill('Tiền', _showMoney, () => setState(() => _showMoney = !_showMoney)),
                      const SizedBox(width: 6),
                      _columnPill('Vé & Phiếu', _showTickets, () => setState(() => _showTickets = !_showTickets)),
                      const SizedBox(width: 6),
                      _columnPill('Cả túi đồ', _showInventory, () => setState(() => _showInventory = !_showInventory)),
                      const SizedBox(width: 6),
                      _columnPill('Nông sản', _showFarm, () => setState(() => _showFarm = !_showFarm)),
                      const SizedBox(width: 6),
                      _columnPill('Sự kiện', _showEvents, () => setState(() => _showEvents = !_showEvents)),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Accounts Table Card
                  Card(
                    color: isDark ? AppTheme.darkCard : AppTheme.lightCard,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder),
                    ),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: DataTable(
                        showCheckboxColumn: false,
                        headingRowColor: WidgetStateProperty.all(
                          isDark ? const Color(0xFF17181C) : Colors.grey.shade100,
                        ),
                        columns: [
                          const DataColumn(label: Text('Tài khoản · Tình trạng')),
                          if (_showCharacter)
                            const DataColumn(label: Text('⭐ Sao', style: TextStyle(fontWeight: FontWeight.bold))),
                          if (_showMoney)
                            const DataColumn(label: Text('💵 Tiền', style: TextStyle(fontWeight: FontWeight.bold))),
                          if (_showMoney)
                            const DataColumn(label: Text('💎 Kim Cương', style: TextStyle(fontWeight: FontWeight.bold))),
                          if (_showMoney)
                            const DataColumn(label: Text('🧈 Vàng', style: TextStyle(fontWeight: FontWeight.bold))),
                          if (_showInventory)
                            const DataColumn(label: Text('📦 Hộp quà', style: TextStyle(fontWeight: FontWeight.bold))),
                          if (_showFarm)
                            const DataColumn(label: Text('🥕 Nông sản', style: TextStyle(fontWeight: FontWeight.bold))),
                          if (_showTickets)
                            const DataColumn(label: Text('🎫 Vé', style: TextStyle(fontWeight: FontWeight.bold))),
                          if (_showEvents)
                            const DataColumn(label: Text('🍁 Sự kiện', style: TextStyle(fontWeight: FontWeight.bold))),
                          const DataColumn(label: Text('Thao tác')),
                        ],
                        rows: _filteredAccounts.map((acc) {
                          return DataRow(
                            onSelectChanged: (_) => _openDetail(acc),
                            cells: [
                              // Account column
                              DataCell(
                                Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 16,
                                      backgroundColor: AppTheme.accentCyan,
                                      child: Text(
                                        acc.username.isNotEmpty ? acc.username[0].toUpperCase() : 'P',
                                        style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 13),
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          acc.username,
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                        ),
                                        Row(
                                          children: [
                                            Text(
                                              acc.status == 'active'
                                                  ? '🟢 Vào được'
                                                  : acc.status == 'banned'
                                                      ? '🔴 Bị khóa'
                                                      : acc.status == 'wrong_pw'
                                                          ? '🟡 Sai MK'
                                                          : '⚪ Chưa check',
                                              style: TextStyle(
                                                fontSize: 11,
                                                color: acc.status == 'active'
                                                    ? AppTheme.accentGreen
                                                    : acc.status == 'banned'
                                                        ? AppTheme.accentRose
                                                        : AppTheme.accentAmber,
                                              ),
                                            ),
                                            const SizedBox(width: 4),
                                            const Text('·', style: TextStyle(fontSize: 11, color: Colors.grey)),
                                            const SizedBox(width: 4),
                                            InkWell(
                                              onTap: () {
                                                Clipboard.setData(ClipboardData(text: acc.roleId));
                                                ScaffoldMessenger.of(context).showSnackBar(
                                                  SnackBar(content: Text('Đã sao chép: ${acc.roleId}')),
                                                );
                                              },
                                              child: Text(
                                                acc.roleId,
                                                style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: Colors.grey),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              // Star
                              if (_showCharacter)
                                DataCell(Text(
                                  _numFormat.format(acc.stars),
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.accentAmber),
                                )),
                              // Bucks
                              if (_showMoney)
                                DataCell(Text(
                                  _numFormat.format(acc.gameBucks),
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.accentGreen),
                                )),
                              // Gems
                              if (_showMoney)
                                DataCell(Text(
                                  _numFormat.format(acc.gems),
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.accentFuchsia),
                                )),
                              // Gold
                              if (_showMoney)
                                DataCell(Text(
                                  _numFormat.format(acc.goldBars),
                                  style: const TextStyle(color: Colors.amber),
                                )),
                              // Boxes
                              if (_showInventory)
                                DataCell(
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.orange.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
                                    ),
                                    child: Text(
                                      '📦 ${_numFormat.format(acc.boxes)}',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.orange),
                                    ),
                                  ),
                                ),
                              // Farm
                              if (_showFarm)
                                DataCell(
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.green.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
                                    ),
                                    child: Text(
                                      '🥕 ${_numFormat.format(acc.totalFruits)}',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppTheme.accentGreen),
                                    ),
                                  ),
                                ),
                              // Tickets
                              if (_showTickets)
                                DataCell(Text(_numFormat.format(acc.tickets))),
                              // Events
                              if (_showEvents)
                                DataCell(Text(_numFormat.format(acc.eventPoints))),
                              // Actions
                              DataCell(
                                Row(
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.edit, size: 18),
                                      onPressed: () => _openDetail(acc),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline, size: 18, color: AppTheme.accentRose),
                                      onPressed: () {
                                        setState(() {
                                          _accounts.removeWhere((a) => a.id == acc.id);
                                        });
                                        _saveData();
                                      },
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _statusFilterChip(String val, String label) {
    final isSelected = _statusFilter == val;
    return ChoiceChip(
      selected: isSelected,
      label: Text(label, style: const TextStyle(fontSize: 12)),
      onSelected: (bool selected) {
        if (selected) setState(() => _statusFilter = val);
      },
    );
  }

  Widget _columnPill(String label, bool isVisible, VoidCallback onToggle) {
    return FilterChip(
      selected: isVisible,
      label: Text(label, style: const TextStyle(fontSize: 11)),
      onSelected: (_) => onToggle(),
    );
  }

  void _openDetail(Account acc) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => DetailScreen(
          account: acc,
          onSave: (updated) {
            setState(() {
              final idx = _accounts.indexWhere((a) => a.id == updated.id);
              if (idx != -1) _accounts[idx] = updated;
            });
            _saveData();
          },
          onDelete: (id) {
            setState(() {
              _accounts.removeWhere((a) => a.id == id);
            });
            _saveData();
          },
        ),
      ),
    );
  }
}
