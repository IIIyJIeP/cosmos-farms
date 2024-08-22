import { useState } from 'react';
import { Box, Spinner, Stack, Text } from '@interchain-ui/react';

import { useGrants } from '@/hooks';
import { PrettyGrant } from '@/utils';
import { GrantCard } from './GrantCard';
import { GrantDetailsModal } from './GrantDetailsModal';
import BalancesOverview from './BalancesOverview';
import { useBalances } from '@/hooks';

type GrantsProps = {
  role: 'granter' | 'grantee';
  chainName: string;
};

export const Grants = ({ chainName, role }: GrantsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewingGrant, setViewingGrant] = useState<PrettyGrant>();

  const { data: grantsData, isLoading: isGrantsLoading, isError: isGrantsError, refetch: grantsRefetch } = useGrants(chainName);
  const isGranter = role === 'granter';
  const grants = isGranter ? grantsData?.granterGrants : grantsData?.granteeGrants;

  type Grants = NonNullable<typeof grants>

  const RenderCards = ({ grants }: { grants: Grants }) => {
    const grantersAddresses: string[] = grants.map(grant => grant.address) || []
    const { data, isLoading, refetch } = useBalances(chainName, grantersAddresses)

    
    return (
      <>
        <Stack attributes={{width: {tablet:'$viewWidth'}}} direction='vertical'>
          {!isGranter && <Box>
            {isLoading || !data ? (
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
                grantersBalances={data}
                updateData={refetch}
                chainName={chainName}
              />
            )}
          </Box>}
          <Box
            width="$full"
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
                balances={data?.balancesData?.[grant.address]}
              />
            ))}
          </Box>


        </Stack>
      </>
    )
  }

  const renderContent = () => {
    if (isGrantsError) {
      return (
        <Text fontSize="$lg" color="$textDanger" fontWeight="$semibold">
          There was an error fetching grants. Please try again later.
        </Text>
      );
    }

    if (isGrantsLoading) {
      return <Spinner size="$6xl" />;
    }

    if (grants && grants.length > 0) {
      return <RenderCards grants={grants} />;
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
