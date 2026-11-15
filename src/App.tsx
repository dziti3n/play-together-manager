import { useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { AccountTable } from './components/AccountTable';
import { AccountInfoModal } from './components/AccountInfoModal';
import { ChestModal } from './components/ChestModal';
import { FarmOrderModal } from './components/FarmOrderModal';
import { GeminiScanModal } from './components/GeminiScanModal';
import { NewAccountModal } from './components/NewAccountModal';
import { ImportExportModal } from './components/ImportExportModal';
import { useAccounts, getTotalFruits } from './hooks/useAccounts';
import { useTheme } from './hooks/useTheme';
import { Account, FruitStock, StatusFilter } from './types';

export function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    fulfillOrder,
    exportToJSON,
    exportToCSV,
    importFromJSON,
    resetToSampleData,
  } = useAccounts();

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [numericField, setNumericField] = useState<string>('none');
  const [numericValue, setNumericValue] = useState<number | null>(null);

  // Modals state
  const [infoAccount, setInfoAccount] = useState<Account | null>(null);
  const [chestAccount, setChestAccount] = useState<Account | null>(null);
  const [aiScanAccount, setAiScanAccount] = useState<Account | null>(null);
  const [isFarmOrderOpen, setIsFarmOrderOpen] = useState(false);
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // Filter accounts
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
        if (numericField === 'fruits') {
          const total = getTotalFruits(acc);
          if (total < numericValue) return false;
        }
        if (numericField === 'gems' && acc.gems < numericValue) return false;
        if (numericField === 'stars' && acc.stars < numericValue) return false;
      }

      return true;
    });
  }, [accounts, search, statusFilter, numericField, numericValue]);

  // Keep modal accounts synchronized with state
  const currentChestAccount = useMemo(() => {
    if (!chestAccount) return null;
    return accounts.find((a) => a.id === chestAccount.id) || chestAccount;
  }, [chestAccount, accounts]);

  const handleAddDetectedFruits = (
    accountId: string,
    detected: Omit<FruitStock, 'id'>[]
  ) => {
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return;

    const newStocks: FruitStock[] = detected.map((d, idx) => ({
      ...d,
      id: 'fs_ai_' + Date.now() + '_' + idx,
    }));

    updateAccount({
      ...acc,
      fruits: [...newStocks, ...acc.fruits],
    });
  };

  return (
    <div className="min-h-screen bg-[#141518] dark:bg-[#141518] light:bg-[#f6f7fb] text-slate-100 dark:text-slate-100 light:text-slate-900 transition-colors">
      {/* Navigation */}
      <Navbar
        accounts={accounts}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenNewAccount={() => setIsNewAccountOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenFarmOrder={() => setIsFarmOrderOpen(true)}
      />

      {/* Main Container */}
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
        />

        <AccountTable
          accounts={filteredAccounts}
          onOpenAccountInfo={(acc) => setInfoAccount(acc)}
          onOpenChest={(acc) => setChestAccount(acc)}
          onDeleteAccount={deleteAccount}
        />
      </main>

      {/* MODAL 1: Account Info (Username, Password, Role ID, Status) */}
      {infoAccount && (
        <AccountInfoModal
          account={infoAccount}
          onClose={() => setInfoAccount(null)}
          onSave={(updated) => {
            updateAccount(updated);
            setInfoAccount(null);
          }}
        />
      )}

      {/* MODAL 2: Chest & Variants Management */}
      {currentChestAccount && (
        <ChestModal
          account={currentChestAccount}
          onClose={() => setChestAccount(null)}
          onUpdateAccount={(updated) => updateAccount(updated)}
          onOpenAIScan={(acc) => {
            setChestAccount(null);
            setAiScanAccount(acc);
          }}
        />
      )}

      {/* MODAL 3: Farm Order Fulfillment across ALL accounts */}
      {isFarmOrderOpen && (
        <FarmOrderModal
          isOpen={isFarmOrderOpen}
          onClose={() => setIsFarmOrderOpen(false)}
          accounts={accounts}
          onFulfillOrder={(allocations) => fulfillOrder(allocations)}
        />
      )}

      {/* MODAL 4: AI Gemini Vision Scanner */}
      {aiScanAccount && (
        <GeminiScanModal
          isOpen={!!aiScanAccount}
          onClose={() => setAiScanAccount(null)}
          targetAccount={aiScanAccount}
          onAddDetectedFruits={handleAddDetectedFruits}
        />
      )}

      {/* MODAL 5: New Account */}
      {isNewAccountOpen && (
        <NewAccountModal
          isOpen={isNewAccountOpen}
          onClose={() => setIsNewAccountOpen(false)}
          onAdd={(newAcc) => addAccount(newAcc)}
        />
      )}

      {/* MODAL 6: Backup / Export / Import */}
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
