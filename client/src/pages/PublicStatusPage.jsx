import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Spinner,
  Stack,
  Badge,
  Alert,
  AlertIcon,
  Divider,
  VStack,
  HStack,
  Icon,
  Select,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
} from '@chakra-ui/react';
import axios from '../utils/axiosInstance';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';

const statusColorMap = {
  operational: 'green',
  degraded: 'yellow',
  partial_outage: 'orange',
  major_outage: 'red',
};

const PublicStatusPage = () => {
  const [organizations, setOrganizations] = useState([]);
  const [orgServices, setOrgServices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await axios.get('/organizations');
        setOrganizations(res.data);
        const servicesData = {};
        for (const org of res.data) {
          const servicesRes = await axios.get(`/services/organization/${org._id}`);
          servicesData[org._id] = servicesRes.data;
        }
        setOrgServices(servicesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  if (loading) return <Spinner size="xl" mt={10} />;
  if (error) {
    return (
      <Alert status="error" mt={6}>
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box maxW="container.lg" mx="auto" p={6}>
      <Heading mb={6}>Public Status Page</Heading>

      {organizations.map((org) => (
        <Card key={org._id} mb={6}>
          <CardHeader>
            <Heading size="md">{org.name}</Heading>
          </CardHeader>
          <CardBody>
            {orgServices[org._id] && orgServices[org._id].length > 0 ? (
              <Stack spacing={4}>
                {orgServices[org._id].map((service) => (
                  <Box key={service._id} p={4} borderWidth="1px" borderRadius="md">
                    <Heading fontSize="lg">{service.name}</Heading>
                    <Text mt={2}>{service.description || 'No description'}</Text>
                    <Badge mt={2} colorScheme={statusColorMap[service.status] || 'gray'}>
                      {service.status.replace('_', ' ')}
                    </Badge>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Text>No services available for this organization.</Text>
            )}
          </CardBody>
        </Card>
      ))}
    </Box>
  );
};

export default PublicStatusPage;
