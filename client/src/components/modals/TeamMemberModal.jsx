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
  Select,
  Button,
  VStack,
  useToast
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

function TeamMemberModal({ isOpen, onClose, member = null, onSave }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const toast = useToast();
  const isEditing = !!member;

  useEffect(() => {
    if (member) {
      // Fix: use the nested email from member.user.email
      setEmail(member.user?.email || '');
      setRole(member.role || 'member');
    } else {
      setEmail('');
      setRole('member');
    }
  }, [member, isOpen]);

  const handleSubmit = () => {
    if (!email.trim()) {
      toast({
        title: 'Error',
        description: 'Email is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Create payload with only email and role
    const updatedMember = { email, role };
    onSave(updatedMember, isEditing);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{isEditing ? 'Edit Team Member' : 'Invite Team Member'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Role</FormLabel>
              <Select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
              </Select>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="brand" onClick={handleSubmit}>
            {isEditing ? 'Update' : 'Invite'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default TeamMemberModal;
