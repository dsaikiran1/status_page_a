import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Select,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import axios from '../utils/axiosInstance';
import { useAuth } from '../contexts/AuthContext';
import ServiceModal from '../components/modals/ServiceModal';
import IncidentModal from '../components/modals/IncidentModal';
import TeamMemberModal from '../components/modals/TeamMemberModal';
import StatusBadge from '../components/StatusBadge';
import OrganizationModal from '../components/modals/OrganizationModal';

function Dashboard() {
  const toast = useToast();
  const { user, isLoading } = useAuth();

  // Organization-related state
  const [organizations, setOrganizations] = useState([]);
  const [orgId, setOrgId] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  // Dashboard data
  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  // Modal and edit state
  const [activeTab, setActiveTab] = useState('services');
  const [serviceToEdit, setServiceToEdit] = useState(null);
  const [incidentToEdit, setIncidentToEdit] = useState(null);
  const [teamMemberToEdit, setTeamMemberToEdit] = useState(null);

  const {
    isOpen: isServiceModalOpen,
    onOpen: onServiceModalOpen,
    onClose: onServiceModalClose
  } = useDisclosure();
  const {
    isOpen: isIncidentModalOpen,
    onOpen: onIncidentModalOpen,
    onClose: onIncidentModalClose
  } = useDisclosure();
  const {
    isOpen: isTeamMemberModalOpen,
    onOpen: onTeamMemberModalOpen,
    onClose: onTeamMemberModalClose
  } = useDisclosure();

  // Fetch all organizations for the logged-in user
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await axios.get('/organizations');
        setOrganizations(res.data);
        if (res.data.length > 0) {
          // Set default to the first organization
          setOrgId(res.data[0]._id);
          setOrganization(res.data[0]);
        } else {
          toast({ title: 'No organizations found', status: 'warning' });
        }
      } catch (err) {
        console.error('Error fetching organizations:', err);
        toast({ title: 'Failed to fetch organizations', status: 'error' });
      }
    };

    if (!isLoading && user) {
      fetchOrganizations();
    }
  }, [user, isLoading, toast]);

  // When orgId changes, re-fetch dashboard data: services, team members, and incidents
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, teamRes, incidentsRes] = await Promise.all([
          axios.get(`/services/organization/${orgId}`),
          axios.get(`/organizations/${orgId}`),
          axios.get(`/incidents/organization/${orgId}`)
        ]);
        console.log('FETCH SUCCESS');
        setServices(servicesRes.data);
        setTeamMembers(teamRes.data.members || []);
        setIncidents(incidentsRes.data || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        toast({ title: 'Failed to fetch dashboard data', status: 'error' });
      }
    };

    if (orgId) {
      fetchData();
    }
  }, [orgId, toast]);

  // Fetch only incidents (used after incident deletion or update)
  const fetchIncidents = async () => {
    try {
      const res = await axios.get(`/incidents/organization/${orgId}`);
      setIncidents(res.data || []);
    } catch (err) {
      console.error('Error fetching incidents:', err);
      toast({ title: 'Failed to fetch incidents', status: 'error' });
    }
  };

  // Validate and save services
  const validateService = (service) => {
    if (!service.name || !service.description || !service.status) {
      toast({ title: 'Name, description, and status are required!', status: 'warning' });
      return false;
    }
    return true;
  };

  const handleServiceSave = async (service, isEditing) => {
    if (!validateService(service)) return;
    try {
      const payload = isEditing
        ? {
            status: service.status,
            message: service.message // must be non-empty when updating
          }
        : { ...service, organization: orgId };
  
      const res = isEditing
        ? await axios.put(`/services/${service._id}/status`, payload)
        : await axios.post(`/services`, payload);
  
      // Check for a successful response status explicitly
      if (res.status >= 200 && res.status < 300) {
        const updated = res.data;
        setServices((prev) =>
          isEditing
            ? prev.map((s) => (s._id === updated._id ? updated : s))
            : [...prev, updated]
        );
        toast({ title: `Service ${isEditing ? 'updated' : 'added'}`, status: 'success' });
      } else {
        // Fallback if status is out of expected range
        toast({ title: 'Error saving service', status: 'error' });
      }
    } catch (err) {
      console.error('Service save error:', err.response ? err.response.data : err);
      // Only show error toast if we truly got an error from the server
      if (err.response && err.response.status >= 400) {
        toast({ title: err.response.data.msg || 'Error saving service', status: 'error' });
      }
    }
  };
  

  // Delete service
  const handleDeleteService = async (serviceId) => {
    try {
      await axios.delete(`/services/${serviceId}`);
      setServices((prev) => prev.filter((service) => service._id !== serviceId));
      toast({ title: 'Service deleted', status: 'info', duration: 3000, isClosable: true });
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to delete service', status: 'error' });
    }
  };

  // Save or update incident
  const handleIncidentSave = async (incident, isEditing) => {
    try {
      const formattedIncident = {
        ...incident,
        organization: orgId,
        services: Array.isArray(incident.services)
          ? incident.services
          : [incident.services],
        type: incident.type || 'incident'
      };

      const res = isEditing
        ? await axios.put(`/incidents/${incident._id}`, formattedIncident)
        : await axios.post(`/incidents`, formattedIncident);

      toast({
        title: `Incident ${isEditing ? 'updated' : 'reported'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await fetchIncidents();
    } catch (err) {
      console.error('Incident save error:', err);
      toast({
        title: 'Failed to save incident',
        description: err?.response?.data?.message || 'Something went wrong',
        status: 'error',
      });
    }
  };

  // Update incident via a dedicated updates route
  const handleIncidentUpdate = async (incidentId, updateData) => {
    try {
      const res = await axios.post(`/incidents/${incidentId}/updates`, updateData);
      const updatedIncident = res.data;
      setIncidents((prev) =>
        prev.map((inc) => (inc._id === updatedIncident._id ? updatedIncident : inc))
      );
      toast({
        title: `Incident status updated to ${updateData.status}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Incident update error:', err);
      toast({
        title: 'Failed to update incident',
        description: err?.response?.data?.errors?.[0]?.msg || err.message,
        status: 'error',
      });
    }
  };

  // Delete incident
  const handleDeleteIncident = async (incidentId) => {
    try {
      await axios.delete(`/incidents/${incidentId}`);
      toast({
        title: 'Incident deleted',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      fetchIncidents();
    } catch (error) {
      console.error(error);
      toast({
        title: 'An error occurred',
        description: error.response?.data?.msg || 'Failed to delete incident',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Validate team member (expecting only email and role from the backend)
  const validateTeamMember = (member) => {
    if (!member.email || !member.role) {
      toast({ title: 'Email and role are required!', status: 'warning' });
      return false;
    }
    return true;
  };

  const handleTeamMemberSave = async (teamMember, isEditing) => {
    if (!validateTeamMember(teamMember)) return;
  
    try {
      const payload = { ...teamMember, organization: orgId };
      console.log("Editing teamMember:", teamMember);
  
      const res = isEditing
        ? await axios.put(`/organizations/${orgId}/members/${teamMember._id || teamMember.user?._id}`, payload)
        : await axios.post(`/organizations/${orgId}/members`, payload);
  
      const updated = res.data;
  
      // Normalize: ensure `user.email` is available
      const normalized = updated.user
        ? updated
        : {
            ...updated,
            user: {
              _id: updated._id || null,
              name: updated.name || '',
              email: updated.email || '',
            },
          };
  
      console.log('Team member saved:', normalized);
  
      setTeamMembers((prev) =>
        isEditing
          ? prev.map((tm) => (tm._id === normalized._id ? normalized : tm))
          : [...prev, normalized]
      );
  
      toast({
        title: `Team member ${isEditing ? 'updated' : 'added'}`,
        status: 'success',
      });
    } catch (err) {
      console.error('Team member save error:', err.response ? err.response.data : err);
      toast({
        title: err.response?.data?.msg || 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
   
  const handleNewOrganizationSubmit = async (orgName, website, logo) => {
    if (!orgName.trim()) {
      toast({
        title: 'Organization name cannot be empty.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
  
    try {
      // Generate slug from the orgName provided
      const slug = orgName.trim().toLowerCase().replace(/\s+/g, '-');
      console.log('Request payload:', { name: orgName, slug, website, logo });
  
      const res = await axios.post('/organizations', {
        name: orgName,
        slug,
        website: website || "",  // Handle optional website field
        logo: logo || "",  // Handle optional logo field
      });
  
      const newOrg = res.data;
      console.log("Organization created:", newOrg);
  
      toast({
        title: 'Organization created successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
  
      // Update organizations list state if needed.
      setOrganizations(prev => [...prev, newOrg]);
      setOrgId(newOrg._id);
      setOrganization(newOrg);
  
      // Reset state and close modal.
      setIsOrgModalOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        title: error.response?.data?.msg || 'Failed to create organization',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  
  // Render
  return (
    <Box p={6}>
      <Heading mb={6}>Dashboard</Heading>
      {organization && (
        <Heading size="lg" mb={4}>
          Welcome to {organization.name}'s Dashboard
        </Heading>
      )}
        <Button
          mb={4}
          colorScheme="teal"
          onClick={() => setIsOrgModalOpen(true)}
        >
          New Organization
        </Button>

      {organizations.length > 1 && (
        
        <Box mb={4}>
          <Heading size="sm" mb={2}>
            Select Organization
          </Heading>
          <Select
            value={orgId || ''}
            onChange={(e) => {
              const selected = organizations.find((org) => org._id === e.target.value);
              setOrgId(selected._id);
              setOrganization(selected);
            }}
          >
            {organizations.map((org) => (
              <option key={org._id} value={org._id}>
                {org.name}
              </option>
            ))}
          </Select>
        </Box>
      )}

      <Flex mb={6} borderBottom="1px" borderColor="gray.200">
        {['services', 'incidents', 'team'].map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'solid' : 'ghost'}
            colorScheme={activeTab === tab ? 'brand' : 'gray'}
            borderBottom={activeTab === tab ? '2px solid' : 'none'}
            borderRadius="0"
            mr={4}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </Flex>

      {activeTab === 'services' && (
        <Box>
          {services.length === 0 ? (
            <Box>No services available.</Box>
          ) : (
            services.map((service) => (
              <Box
                key={service._id}
                bg="white"
                boxShadow="md"
                borderRadius="lg"
                p={5}
                mb={4}
              >
                <Flex justify="space-between" align="center">
                  <Heading size="md" fontWeight="bold">
                    {service.name}
                  </Heading>
                  <StatusBadge status={service.status || 'operational'} />
                </Flex>
                <HStack mt={2} spacing={4}>
                  <Button
                    size="sm"
                    onClick={() => {
                      setServiceToEdit(service);
                      onServiceModalOpen();
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDeleteService(service._id)}
                  >
                    Delete
                  </Button>
                </HStack>
              </Box>
            ))
          )}
          <Button
            mt={4}
            colorScheme="blue"
            onClick={() => {
              setServiceToEdit(null);
              onServiceModalOpen();
            }}
          >
            Add Service
          </Button>
        </Box>
      )}

      {activeTab === 'incidents' && (
        <Box>
          {incidents.length === 0 ? (
            <Box>No incidents reported.</Box>
          ) : (
            incidents.map((incident) => (
              <Box
                key={incident._id}
                bg="white"
                boxShadow="md"
                borderRadius="lg"
                p={5}
                mb={4}
              >
                <Flex justify="space-between" align="center">
                  <Heading size="md" fontWeight="bold">
                    {incident.title}
                  </Heading>
                  <StatusBadge status={incident.status || 'investigating'} />
                </Flex>
                <HStack spacing={4} mt={3}>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={() => {
                      setIncidentToEdit(incident);
                      onIncidentModalOpen();
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDeleteIncident(incident._id)}
                  >
                    Delete
                  </Button>
                </HStack>
              </Box>
            ))
          )}
          <Button
            mt={4}
            colorScheme="green"
            onClick={() => {
              setIncidentToEdit(null);
              onIncidentModalOpen();
            }}
          >
            Report Incident
          </Button>
        </Box>
      )}

    {activeTab === 'team' && (
      <Box>
        {teamMembers.length === 0 ? (
          <Box>No team members found.</Box>
        ) : (
          teamMembers.map((member) => (
            <Box
              key={member._id}
              bg="white"
              boxShadow="md"
              borderRadius="lg"
              p={4}
              mb={4}
            >
              <Heading size="md" fontWeight="bold">
                Member: {member.user?.email}
              </Heading>
              <Box mt={2}>
              <Box>
              <strong>Email:</strong> {member.user?.email || 'email@example.com'}
            </Box>
                <Box><strong>Role:</strong>{member.role}</Box>
                <Button
                  size="sm"
                  ml={4}
                  onClick={() => {
                    setTeamMemberToEdit(member);
                    onTeamMemberModalOpen();
                  }}
                >
                  Edit
                </Button>
              </Box>
            </Box>
          ))
        )}
    <Button
      mt={4}
      colorScheme="blue"
      onClick={() => {
        setTeamMemberToEdit(null);
        onTeamMemberModalOpen();
      }}
    >
      Add Team Member
    </Button>
  </Box>
)}

      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={onServiceModalClose}
        service={serviceToEdit}
        onSave={handleServiceSave}
        orgId={orgId}
      />

      <IncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => {
          setIncidentToEdit(null);
          onIncidentModalClose();
        }}
        incident={incidentToEdit}
        services={services}
        onSuccess={(incident, isEditing) => handleIncidentSave(incident, isEditing)}
      />

      <TeamMemberModal
        isOpen={isTeamMemberModalOpen}
        onClose={onTeamMemberModalClose}
        member={teamMemberToEdit}
        onSave={(member, isEditing) => handleTeamMemberSave(member, isEditing)}
      />

      <OrganizationModal
        isOpen={isOrgModalOpen}
        onClose={() => setIsOrgModalOpen(false)}
        onSave={handleNewOrganizationSubmit}
      />

    </Box>
  );
}

export default Dashboard;
