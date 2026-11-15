import { useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { AccountTable } from './components/AccountTable';
import { AccountDetailModal } from './components/AccountDetailModal';
import { NewAccountModal } from './components/NewAccountModal';
import { ImportExportModal } from './components/ImportExportModal';
import { useAccounts, getTotalFruits } from './hooks/useAccounts';
import { useTheme } from './hooks/useTheme';
import { Account, ColumnSettings, StatusFilter } from './types';

export function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    exportToJSON,
    exportToCSV,
    importFromJSON,
    resetToSampleData,
  } = useAccounts();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [numericField, setNumericField] = useState<string>('none');
  const [numericValue, setNumericValue] = useState<number | null>(null);

  const [columnSettings, setColumnSettings] = useState<ColumnSettings>({
    character: true,
    money: true,
    tickets: true,
    inventory: true,
    farm: true,
    events: true,
  });

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  const handleToggleColumn = (col: keyof ColumnSettings) => {
    setColumnSettings((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchUser = acc.username.toLowerCase().includes(query);
        const matchChar = acc.characterName.toLowerCase().includes(query);
        const matchRole = acc.roleId.toLowerCase().includes(query);
        if (!matchUser && !matchChar && !matchRole) return false;
      }

      if (statusFilter !== 'all' && acc.status !== statusFilter) {
        return false;
      }

      if (numericField !== 'none' && numericValue !== null && numericValue > 0) {
        if (numericField === 'gems' && acc.gems < numericValue) return false;
        if (numericField === 'gameBucks' && acc.gameBucks < numericValue) return false;
        if (numericField === 'boxes' && acc.boxes < numericValue) return false;
        if (numericField === 'stars' && acc.stars < numericValue) return false;
        if (numericField === 'farm') {
          const totalFruits = getTotalFruits(acc);
          if (totalFruits < numericValue) return false;
        }
      }

      return true;
    });
  }, [accounts, search, statusFilter, numericField, numericValue]);

  return (
    <div className="min-h-screen bg-[#141518] dark:bg-[#141518] light:bg-[#f6f7fb] text-slate-100 dark:text-slate-100 light:text-slate-900 transition-colors">
      <Navbar
        accounts={accounts}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenNewAccount={() => setIsNewAccountOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 sm:py-8">
        <FilterBar
          accounts={accounts}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          numericField={numericField}
          numericValue={numericValue}
          onNumericFilterChange={(field, val) => {
            setNumericField(field);
            setNumericValue(val);
          }}
          columnSettings={columnSettings}
          onToggleColumn={handleToggleColumn}
        />

        <AccountTable
          accounts={filteredAccounts}
          columnSettings={columnSettings}
          onSelectAccount={(acc) => setSelectedAccount(acc)}
          onDeleteAccount={deleteAccount}
        />
      </main>

      {selectedAccount && (
        <AccountDetailModal
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
          onSave={(updated) => {
            updateAccount(updated);
            setSelectedAccount(null);
          }}
          onDelete={(id) => {
            deleteAccount(id);
            setSelectedAccount(null);
          }}
        />
      )}

      {isNewAccountOpen && (
        <NewAccountModal
          isOpen={isNewAccountOpen}
          onClose={() => setIsNewAccountOpen(false)}
          onAdd={(newAcc) => addAccount(newAcc)}
        />
      )}

      {isBackupOpen && (
        <ImportExportModal
          isOpen={isBackupOpen}
          onClose={() => setIsBackupOpen(false)}
          accounts={accounts}
          onExportJSON={exportToJSON}
          onExportCSV={exportToCSV}
          onImportJSON={importFromJSON}
          onResetSample={resetToSampleData}
        />
      )}
    </div>
  );
}

export default App;
