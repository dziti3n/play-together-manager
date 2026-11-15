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
import { FeaturedCropsModal } from './components/FeaturedCropsModal';
import { ConnectMobileModal } from './components/ConnectMobileModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { useAccounts, getTotalFruits } from './hooks/useAccounts';
import { useTheme } from './hooks/useTheme';
import { Account, DetectedFruitItem, HarvestedFruit, StatusFilter } from './types';

export function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    accounts,
    orders,
    featuredCrops,
    toggleFeaturedCrop,
    clearFeaturedCrops,
    resetFeaturedCrops,
    addAccount,
    updateAccount,
    deleteAccount,
    addFruitsToAccount,
    syncAccountFruits,
    removeFruitFromAccount,
    fulfillOrderDeduction,
    addOrder,
    deleteOrder,
    exportToJSON,
    exportToCSV,
    importFromJSON,
    resetToSampleData,
    isCloudConnected,
    cloudStatus,
    cloudConfig,
    setCloudConfig,
    reconnectCloud,
  } = useAccounts();

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [numericField, setNumericField] = useState<string>('none');
  const [numericValue, setNumericValue] = useState<number | null>(null);

  // Modals state
  const [infoAccount, setInfoAccount] = useState<Account | null>(null);
  const [chestAccount, setChestAccount] = useState<Account | null>(null);
  const [chestInitialFruit, setChestInitialFruit] = useState<string | null>(null);
  const [aiScanAccount, setAiScanAccount] = useState<Account | null>(null);
  const [isFarmOrderOpen, setIsFarmOrderOpen] = useState(false);
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isFeaturedModalOpen, setIsFeaturedModalOpen] = useState(false);
  const [isConnectMobileOpen, setIsConnectMobileOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);

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

  const handleSyncDetectedFruits = (
    accountId: string,
    detected: DetectedFruitItem[],
    mode: 'replace' | 'append' = 'replace'
  ) => {
    const newItems: Omit<HarvestedFruit, 'id' | 'createdAt'>[] = [];
    detected.forEach((d) => {
      const qty = Math.max(1, d.quantity || 1);
      for (let i = 0; i < qty; i++) {
        newItems.push({
          fruitName: d.fruitName,
          variants: d.variants || [],
        });
      }
    });
    syncAccountFruits(accountId, newItems, mode);
  };

  return (
    <div className="min-h-screen bg-[#F6F4EE] dark:bg-[#131418] text-slate-800 dark:text-slate-100 transition-colors">
      {/* Navigation */}
      <Navbar
        accounts={accounts}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenNewAccount={() => setIsNewAccountOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenFarmOrder={() => setIsFarmOrderOpen(true)}
        onOpenConnectMobile={() => setIsConnectMobileOpen(true)}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
        isCloudConnected={isCloudConnected}
        cloudStatus={cloudStatus}
        cloudRoomId={cloudConfig?.roomId}
        onReconnectCloud={reconnectCloud}
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
          featuredCrops={featuredCrops}
          onOpenAccountInfo={(acc) => setInfoAccount(acc)}
          onOpenChest={(acc) => {
            setChestAccount(acc);
            setChestInitialFruit(null);
          }}
          onOpenFruitDetail={(acc, fruitName) => {
            setChestAccount(acc);
            setChestInitialFruit(fruitName);
          }}
          onOpenFeaturedModal={() => setIsFeaturedModalOpen(true)}
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

      {/* MODAL 2: Chest & Variants Management (Lọc Nông Sản & Thu Hoạch Trái) */}
      {currentChestAccount && (
        <ChestModal
          account={currentChestAccount}
          initialFruitName={chestInitialFruit}
          onClose={() => {
            setChestAccount(null);
            setChestInitialFruit(null);
          }}
          onAddFruits={addFruitsToAccount}
          onRemoveFruit={removeFruitFromAccount}
          onOpenAIScan={(acc) => {
            setChestAccount(null);
            setChestInitialFruit(null);
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
          orders={orders}
          onAddOrder={addOrder}
          onDeleteOrder={deleteOrder}
          onFulfillOrderDeduction={fulfillOrderDeduction}
        />
      )}

      {/* MODAL 4: AI Gemini Vision Scanner */}
      {aiScanAccount && (
        <GeminiScanModal
          isOpen={!!aiScanAccount}
          onClose={() => setAiScanAccount(null)}
          targetAccount={aiScanAccount}
          onSyncFruits={handleSyncDetectedFruits}
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

      {/* MODAL 7: Featured Crops (Ghim Quả Nổi Bật) */}
      {isFeaturedModalOpen && (
        <FeaturedCropsModal
          isOpen={isFeaturedModalOpen}
          onClose={() => setIsFeaturedModalOpen(false)}
          featuredCrops={featuredCrops}
          onToggleCrop={toggleFeaturedCrop}
          onResetDefaults={resetFeaturedCrops}
          onClearAll={clearFeaturedCrops}
        />
      )}

      {/* MODAL 8: Connect Mobile Phone */}
      {isConnectMobileOpen && (
        <ConnectMobileModal
          isOpen={isConnectMobileOpen}
          onClose={() => setIsConnectMobileOpen(false)}
          networkIp="192.168.1.7"
        />
      )}

      {/* MODAL 9: Cloud Sync Supabase */}
      {isCloudSyncOpen && (
        <CloudSyncModal
          isOpen={isCloudSyncOpen}
          onClose={() => setIsCloudSyncOpen(false)}
          onConfigChanged={(cfg) => setCloudConfig(cfg)}
          isConnected={isCloudConnected}
          currentRoomId={cloudConfig?.roomId}
        />
      )}
    </div>
  );
}

export default App;
