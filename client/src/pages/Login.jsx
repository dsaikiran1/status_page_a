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
  import { Link as RouterLink, useNavigate } from 'react-router-dom';
  import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
  import { useAuth } from '../contexts/AuthContext';
  import axios from '../utils/axiosInstance';
  
  function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();
    const { login } = useAuth();
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsLoading(true);
  
      try {
        const res = await axios.post('/auth/login', { email, password });
        const { token, user } = res.data;
  
        login(user, token);
  
        toast({
          title: 'Login successful!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
  
        navigate('/dashboard');
      } catch (error) {
        toast({
          title: 'Login failed',
          description:
            error.response?.data?.msg || 'Something went wrong. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
  
      setIsLoading(false);
    };
  
    return (
      <Container maxW="md" py={12}>
        <Card>
          <CardBody>
            <VStack spacing={6}>
              <Heading textAlign="center">Welcome Back</Heading>
              <Text align="center" color="gray.600">
                Enter your credentials to access your dashboard
              </Text>
  
              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <VStack spacing={4} align="flex-start">
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
                        placeholder="Enter your password"
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
  
                  <Link alignSelf="flex-end" fontSize="sm" color="brand.500">
                    Forgot password?
                  </Link>
  
                  <Button
                    type="submit"
                    colorScheme="brand"
                    width="full"
                    mt={4}
                    isLoading={isLoading}
                  >
                    Sign In
                  </Button>
                </VStack>
              </form>
  
              <Text fontSize="sm">
                Don't have an account?{' '}
                <Link as={RouterLink} to="/register" color="brand.500">
                  Create one
                </Link>
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    );
  }
  
  export default Login;
  