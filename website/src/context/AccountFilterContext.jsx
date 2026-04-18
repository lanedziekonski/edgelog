import { createContext, useContext, useState } from 'react';

const AccountFilterContext = createContext({ selectedAccountId: null, setSelectedAccountId: () => {} });

export function AccountFilterProvider({ children }) {
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  return (
    <AccountFilterContext.Provider value={{ selectedAccountId, setSelectedAccountId }}>
      {children}
    </AccountFilterContext.Provider>
  );
}

export function useAccountFilter() {
  return useContext(AccountFilterContext);
}
