import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  VStack,
  Button,
  Flex,
  Checkbox,
  useToast
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';

const incidentStatusOptions = [
  { value: 'investigating', label: 'Investigating' },
  { value: 'identified', label: 'Identified' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'resolved', label: 'Resolved' }
];

function IncidentModal({ isOpen, onClose, incident = null, services = [], onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('investigating');
  const [affectedServices, setAffectedServices] = useState([]);
  const toast = useToast();
  const isEditing = !!incident;

  useEffect(() => {
    if (incident) {
      setTitle(incident.title || '');
      setDescription(incident.description || '');
      setStatus(incident.status || 'investigating');
      setAffectedServices(incident.services || []);
    } else {
      setTitle('');
      setDescription('');
      setStatus('investigating');
      setAffectedServices([]);
    }
  }, [incident]);

  const handleServiceToggle = (serviceId) => {
    setAffectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({
        title: 'Incident title is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (affectedServices.length === 0) {
      toast({
        title: 'At least one service must be affected',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const updatedIncident = {
      ...incident,
      title,
      description,
      status,
      services: affectedServices,
    };

    // Use onSuccess prop instead of onSave
    onSuccess(updatedIncident, isEditing);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{isEditing ? 'Edit Incident' : 'Report New Incident'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Title</FormLabel>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. API latency issue"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of the incident"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                {incidentStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Affected Services</FormLabel>
              <VStack align="start" spacing={1} maxH="150px" overflowY="auto">
                {services.map((service) => (
                  <Flex key={service._id} w="100%">
                    <Checkbox
                      isChecked={affectedServices.includes(service._id)}
                      onChange={() => handleServiceToggle(service._id)}
                    >
                      {service.name}
                    </Checkbox>
                  </Flex>
                ))}
              </VStack>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="brand" onClick={handleSubmit}>
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default IncidentModal;
