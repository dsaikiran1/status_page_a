import { Box, Flex, Heading, Button, Spacer, HStack, Avatar, Menu, MenuButton, MenuList, MenuItem, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChevronDownIcon } from '@chakra-ui/icons';

function Header() {
  const { user, logout } = useAuth();

  return (
    <Flex 
      as="header" 
      alignItems="center" 
      p={4} 
      boxShadow="sm"
      bg="white"
    >
      <Heading size="md" as={RouterLink} to="/">StatusHub</Heading>
      <Spacer />
      <Box>
        {user ? (
          <HStack spacing={4}>
            <Button 
              as={RouterLink} 
              to="/dashboard" 
              colorScheme="brand"
              variant="ghost"
            >
              Dashboard
            </Button>
            <Menu>
              <MenuButton 
                as={Button} 
                rightIcon={<ChevronDownIcon />}
                variant="ghost"
              >
                <HStack>
                  <Avatar size="sm" name={user.name} />
                  <Text display={{ base: 'none', md: 'block' }}>{user.name}</Text>
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem>Profile</MenuItem>
                <MenuItem>Settings</MenuItem>
                <MenuItem onClick={logout}>Logout</MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        ) : (
          <HStack>
            <Button 
              as={RouterLink} 
              to="/login" 
              colorScheme="brand" 
              variant="ghost" 
              mr={2}
            >
              Login
            </Button>
            
          </HStack>
        )}
      </Box>
    </Flex>
  );
}

export default Header;