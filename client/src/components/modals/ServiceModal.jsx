import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    Select,
    Button,
    VStack,
    useToast
  } from '@chakra-ui/react';
  import { useState, useEffect } from 'react';
  
  const statusOptions = [
    { value: 'operational', label: 'Operational' },
    { value: 'degraded', label: 'Degraded' },
    { value: 'partial_outage', label: 'Partial Outage' },
    { value: 'major_outage', label: 'Major Outage' },
  ];
  
  function ServiceModal({ isOpen, onClose, service = null, onSave }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('operational');
    const [statusMessage, setStatusMessage] = useState('');
    const isEditing = !!service;
    const toast = useToast();
  
    useEffect(() => {
      if (service) {
        setName(service.name || '');
        setDescription(service.description || '');
        setStatus(service.status || 'operational');
        setStatusMessage(service.message || '');
      }
    }, [service]);
  
    const handleSubmit = () => {
      if (!name.trim()) {
        toast({
          title: 'Service name is required',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
  
      const updatedService = {
        ...service,
        name,
        description,
        status,
        message: statusMessage,
      };
  
      onSave(updatedService, isEditing);
      onClose();
  
      if (!isEditing) {
        setName('');
        setDescription('');
        setStatus('operational');
      }
    };
  
    return (
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{isEditing ? 'Edit Service' : 'Add New Service'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Service Name</FormLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Website, API, Database"
                />
              </FormControl>
  
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this service"
                />
              </FormControl>
  
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
              <FormLabel>Status Message</FormLabel>
              <Textarea
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
                placeholder="Reason for current status"
              />
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
  
  export default ServiceModal;
  