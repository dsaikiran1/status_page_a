import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    VStack,
    Heading,
    Text,
    Link,
    Container,
    Card,
    CardBody,
    InputGroup,
    InputRightElement,
    useToast,
  } from '@chakra-ui/react';
  import { useState } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
  import { useAuth } from '../contexts/AuthContext';
  import axios from '../utils/axiosInstance';

  function Register() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();
    const { login } = useAuth(); // You can swap this with register() if your context supports it
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      if (password !== confirmPassword) {
        toast({
          title: 'Passwords do not match',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
        return;
      }
  
      setIsLoading(true);
  
      try {
        const response = await axios.post('/auth/register', {
          name,
          email,
          password,
        });
      
        const { token, user } = response.data;
      
        // Store user and token
        login(user, token);
      
        toast({
          title: 'Account created!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      
        navigate('/dashboard');
      } catch (error) {
        toast({
          title: 'Registration failed',
          description: error.response?.data?.msg || 'Something went wrong',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
      
    };
  
    return (
      <Container maxW="md" py={12}>
        <Card>
          <CardBody>
            <VStack spacing={6}>
              <Heading textAlign="center">Create an Account</Heading>
              <Text align="center" color="gray.600">
                Fill in your details to sign up
              </Text>
  
              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <VStack spacing={4} align="flex-start">
                  <FormControl isRequired>
                    <FormLabel>Name</FormLabel>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </FormControl>
  
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                  </FormControl>
  
                  <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter a secure password"
                      />
                      <InputRightElement width="4.5rem">
                        <Button
                          h="1.75rem"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>
  
                  <FormControl isRequired>
                    <FormLabel>Confirm Password</FormLabel>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                    />
                  </FormControl>
  
                  <Button
                    type="submit"
                    colorScheme="brand"
                    width="full"
                    mt={4}
                    isLoading={isLoading}
                  >
                    Sign Up
                  </Button>
                </VStack>
              </form>
  
              <Text fontSize="sm">
                Already have an account?{' '}
                <Link color="brand.500" href="/login">
                  Sign in
                </Link>
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    );
  }
  
  export default Register;
  