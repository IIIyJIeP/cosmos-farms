import { useEffect, useReducer, useState } from 'react';
import { Box, Spinner, Stack, Text } from '@interchain-ui/react';

import { resetBalances, useGrantersBalances, useGrants } from '@/hooks';
import { PrettyGrant } from '@/utils';
import { GrantCard } from './GrantCard';
import { GrantDetailsModal } from './GrantDetailsModal';
import BalancesOverview from './BalancesOverview';

type GrantsProps = {
  role: 'granter' | 'grantee';
  chainName: string;
};

export const Grants = ({ chainName, role }: GrantsProps) => {
  const [counter, forceUpdate] = useReducer(x => x + 1, 0)
  const [isOpen, setIsOpen] = useState(false);
  const [viewingGrant, setViewingGrant] = useState<PrettyGrant>();
  const { data, isLoading, isError, refetch } = useGrants(chainName);
  const [grantersBalances, dispatchGrantersBalances] = useGrantersBalances()
  const isGranter = role === 'granter';
  const grants = isGranter ? data?.granterGrants : data?.granteeGrants;

  useEffect(() => {
    dispatchGrantersBalances(resetBalances())
  }, [dispatchGrantersBalances, grants])
  
  const renderContent = () => {
    if (isError) {
      return (
        <Text fontSize="$lg" color="$textDanger" fontWeight="$semibold">
          There was an error fetching grants. Please try again later.
        </Text>
      );
    }

    if (isLoading) {
      return <Spinner size="$6xl" />;
    }
    
    if (grants && grants.length > 0) {
      return (
        <>
          <Stack direction='vertical'>
            {!isGranter && <Box>
              {grantersBalances.length === 0 ? (
                <Box
                  height="$28"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Spinner size="$7xl" />
                </Box>
              ) : (
                <BalancesOverview 
                  grants={grants}
                  grantersBalances={grantersBalances}
                  updateData={forceUpdate}
                  chainName={chainName}
                />
              )}
            </Box>}
            <Box
              width="$full"
              alignSelf="flex-start"
              display="grid"
              gridTemplateColumns={{ mobile: '1fr', tablet: '1fr 1fr' }}
              gap="$10"
            >
              {grants.map((grant) => (
                <GrantCard
                  key={grant.address}
                  role={role}
                  grant={grant}
                  chainName={chainName}
                  onViewDetails={() => {
                    setIsOpen(true);
                    setViewingGrant(grant);
                  }}
                  dispatchGrantersBalances={dispatchGrantersBalances}
                  count={counter}
                />
              ))}
            </Box>
          </Stack>
        </>
      );
    }

    return (
      <Text fontSize="$lg" color="$textSecondary" fontWeight="$semibold">
        {isGranter
          ? "You haven't granted any permission yet"
          : "You don't have any grants"}
      </Text>
    );
  };

  return (
    <Box flex="1" display="flex" justifyContent="center" alignItems="center">
      {renderContent()}

      {viewingGrant && (
        <GrantDetailsModal
          role={role}
          grant={viewingGrant}
          isOpen={isOpen}
          chainName={chainName}
          onClose={() => setIsOpen(false)}
        />
      )}
    </Box>
  );
};
