import { Badge, Icon } from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, InfoIcon } from '@chakra-ui/icons';

function StatusBadge({ status }) {
  const statusProps = {
    operational: {
      colorScheme: 'green',
      icon: CheckCircleIcon,
      text: 'Operational'
    },
    degraded: {
      colorScheme: 'yellow',
      icon: WarningIcon,
      text: 'Degraded Performance'
    },
    partial_outage: {
      colorScheme: 'orange',
      icon: WarningIcon,
      text: 'Partial Outage'
    },
    major_outage: {
      colorScheme: 'red',
      icon: WarningIcon,
      text: 'Major Outage'
    },
    investigating: {
      colorScheme: 'orange',
      icon: InfoIcon,
      text: 'Investigating'
    },
    identified: {
      colorScheme: 'blue',
      icon: InfoIcon,
      text: 'Identified'
    },
    monitoring: {
      colorScheme: 'purple',
      icon: InfoIcon,
      text: 'Monitoring'
    },
    resolved: {
      colorScheme: 'green',
      icon: CheckCircleIcon,
      text: 'Resolved'
    }
  };

  const { colorScheme, icon, text } = statusProps[status] || statusProps.operational;

  return (
    <Badge
      colorScheme={colorScheme}
      display="flex"
      alignItems="center"
      px={2}
      py={1}
      borderRadius="md"
    >
      <Icon as={icon} mr={1} />
      {text}
    </Badge>
  );
}

export default StatusBadge;
