import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  useToast,
} from '@chakra-ui/react';

const OrganizationModal = ({ isOpen, onClose, onSave }) => {
  const [orgName, setOrgName] = useState('');
  const [website, setWebsite] = useState('');
  const [logo, setLogo] = useState('');
  const toast = useToast();

  const handleSave = async () => {
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
      await onSave(orgName, website, logo);
      setOrgName('');
      setWebsite('');
      setLogo('');
      onClose();
    } catch (err) {
      toast({
        title: 'Error creating organization.',
        description: err?.message || 'Something went wrong.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Organization</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Input
            placeholder="Organization Name"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
          <Input
            placeholder="Website URL (optional)"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            mt={3}
          />
          <Input
            placeholder="Logo URL (optional)"
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            mt={3}
          />
        </ModalBody>
        <ModalFooter>
          <Button mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSave}>
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default OrganizationModal;