"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  Title, 
  Text, 
  Button, 
  Group, 
  Switch, 
  TextInput, 
  PasswordInput,
  Tabs,
  Divider,
  Select,
  ColorInput,
  Stack,
  Textarea,
  NumberInput,
  FileInput,
  Avatar,
  Box,
  ActionIcon
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { 
  IconUser, 
  IconLock, 
  IconBell, 
  IconPalette, 
  IconBrandStripe,
  IconMail,
  IconUpload,
  IconTrash,
  IconQrcode
} from "@tabler/icons-react";

export default function SettingsPage() {
  // User profile state
  const [profileForm, setProfileForm] = useState({
    firstName: "Admin",
    lastName: "User",
    email: "admin@example.com",
    phone: "(555) 123-4567",
    avatar: null as File | null
  });

  // Security state
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    loginAlerts: true
  });

  // Appearance settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: "light" as "light" | "dark" | "auto",
    primaryColor: "#1c7ed6",
    fontSize: "medium" as "small" | "medium" | "large",
    compactMode: false
  });

  // API settings
  const [apiSettings, setApiSettings] = useState({
    stripePublicKey: "",
    stripeSecretKey: "",
    handyApiKey: "",
    googleMapsApiKey: ""
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would call your API to update the profile
    notifications.show({
      title: "Success",
      message: "Profile updated successfully",
      color: "green"
    });
  };

  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      notifications.show({
        title: "Error",
        message: "New passwords do not match",
        color: "red"
      });
      return;
    }
    
    // In a real app, you would call your API to update the password
    notifications.show({
      title: "Success",
      message: "Password updated successfully",
      color: "green"
    });
    
    // Reset form
    setSecurityForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
  };

  const handleNotificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would call your API to update notification settings
    notifications.show({
      title: "Success",
      message: "Notification settings updated successfully",
      color: "green"
    });
  };

  const handleAppearanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would call your API to update appearance settings
    notifications.show({
      title: "Success",
      message: "Appearance settings updated successfully",
      color: "green"
    });
  };

  const handleApiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would call your API to update API settings
    notifications.show({
      title: "Success",
      message: "API settings updated successfully",
      color: "green"
    });
  };

  return (
    <div className="container mx-auto p-4">
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Title order={2} mb="md">Settings</Title>
        
        <Tabs defaultValue="profile">
          <Tabs.List mb="md">
            <Tabs.Tab value="profile" leftSection={<IconUser size={16} />}>
              Profile
            </Tabs.Tab>
            <Tabs.Tab value="security" leftSection={<IconLock size={16} />}>
              Security
            </Tabs.Tab>
            <Tabs.Tab value="notifications" leftSection={<IconBell size={16} />}>
              Notifications
            </Tabs.Tab>
            <Tabs.Tab value="appearance" leftSection={<IconPalette size={16} />}>
              Appearance
            </Tabs.Tab>
            <Tabs.Tab value="api" leftSection={<IconBrandStripe size={16} />}>
              API Keys
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="profile">
            <form onSubmit={handleProfileSubmit}>
              <Stack gap="md">
                <Group align="flex-start">
                  <Box>
                    <Avatar 
                      size="xl" 
                      src={profileForm.avatar ? URL.createObjectURL(profileForm.avatar) : null} 
                      alt="Profile picture"
                      radius="xl"
                    >
                      {!profileForm.avatar && `${profileForm.firstName[0]}${profileForm.lastName[0]}`}
                    </Avatar>
                    <Group mt="xs">
                      <FileInput
                        placeholder="Upload avatar"
                        accept="image/png,image/jpeg"
                        value={profileForm.avatar}
                        onChange={(file) => setProfileForm({...profileForm, avatar: file})}
                        leftSection={<IconUpload size={16} />}
                        size="xs"
                        style={{ maxWidth: 200 }}
                      />
                      {profileForm.avatar && (
                        <ActionIcon 
                          color="red" 
                          variant="subtle"
                          onClick={() => setProfileForm({...profileForm, avatar: null})}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Box>
                  
                  <Stack style={{ flex: 1 }}>
                    <Group grow>
                      <TextInput
                        label="First Name"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                        required
                      />
                      <TextInput
                        label="Last Name"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                        required
                      />
                    </Group>
                    <TextInput
                      label="Email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                      required
                      leftSection={<IconMail size={16} />}
                    />
                    <TextInput
                      label="Phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    />
                  </Stack>
                </Group>
                
                <Group justify="flex-end">
                  <Button type="submit">Save Profile</Button>
                </Group>
              </Stack>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="security">
            <form onSubmit={handleSecuritySubmit}>
              <Stack gap="md">
                <PasswordInput
                  label="Current Password"
                  value={securityForm.currentPassword}
                  onChange={(e) => setSecurityForm({...securityForm, currentPassword: e.target.value})}
                  required
                />
                <PasswordInput
                  label="New Password"
                  value={securityForm.newPassword}
                  onChange={(e) => setSecurityForm({...securityForm, newPassword: e.target.value})}
                  required
                />
                <PasswordInput
                  label="Confirm New Password"
                  value={securityForm.confirmPassword}
                  onChange={(e) => setSecurityForm({...securityForm, confirmPassword: e.target.value})}
                  required
                />
                
                <Divider my="sm" />
                
                <Title order={4}>Two-Factor Authentication</Title>
                <Text size="sm" c="dimmed">
                  Add an extra layer of security to your account by enabling two-factor authentication.
                </Text>
                <TwoFactorAuthSection />
                
                <Group justify="flex-end">
                  <Button type="submit" color="blue">Update Password</Button>
                </Group>
              </Stack>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="notifications">
            <form onSubmit={handleNotificationSubmit}>
              <Stack gap="md">
                <Title order={4}>Email Notifications</Title>
                <Group>
                  <Switch
                    label="Receive email notifications"
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings, 
                      emailNotifications: e.currentTarget.checked
                    })}
                  />
                </Group>
                
                <Title order={4}>SMS Notifications</Title>
                <Group>
                  <Switch
                    label="Receive SMS notifications"
                    checked={notificationSettings.smsNotifications}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings, 
                      smsNotifications: e.currentTarget.checked
                    })}
                  />
                </Group>
                
                <Title order={4}>Marketing</Title>
                <Group>
                  <Switch
                    label="Receive marketing emails"
                    checked={notificationSettings.marketingEmails}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings, 
                      marketingEmails: e.currentTarget.checked
                    })}
                  />
                </Group>
                
                <Title order={4}>Security</Title>
                <Group>
                  <Switch
                    label="Receive login alerts"
                    checked={notificationSettings.loginAlerts}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings, 
                      loginAlerts: e.currentTarget.checked
                    })}
                  />
                </Group>
                
                <Group justify="flex-end">
                  <Button type="submit">Save Notification Settings</Button>
                </Group>
              </Stack>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="appearance">
            <form onSubmit={handleAppearanceSubmit}>
              <Stack gap="md">
                <Select
                  label="Theme"
                  value={appearanceSettings.theme}
                  onChange={(value) => setAppearanceSettings({
                    ...appearanceSettings, 
                    theme: value as "light" | "dark" | "auto"
                  })}
                  data={[
                    { value: "light", label: "Light" },
                    { value: "dark", label: "Dark" },
                    { value: "auto", label: "Auto (follow system)" }
                  ]}
                />
                
                <ColorInput
                  label="Primary Color"
                  value={appearanceSettings.primaryColor}
                  onChange={(value) => setAppearanceSettings({
                    ...appearanceSettings, 
                    primaryColor: value
                  })}
                  format="hex"
                  swatches={['#1c7ed6', '#37b24d', '#f03e3e', '#f59f00', '#7950f2', '#fa5252', '#12b886', '#228be6']}
                />
                
                <Select
                  label="Font Size"
                  value={appearanceSettings.fontSize}
                  onChange={(value) => setAppearanceSettings({
                    ...appearanceSettings, 
                    fontSize: value as "small" | "medium" | "large"
                  })}
                  data={[
                    { value: "small", label: "Small" },
                    { value: "medium", label: "Medium" },
                    { value: "large", label: "Large" }
                  ]}
                />
                
                <Switch
                  label="Compact Mode"
                  checked={appearanceSettings.compactMode}
                  onChange={(e) => setAppearanceSettings({
                    ...appearanceSettings, 
                    compactMode: e.currentTarget.checked
                  })}
                />
                
                <Group justify="flex-end">
                  <Button type="submit">Save Appearance Settings</Button>
                </Group>
              </Stack>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="api">
            <form onSubmit={handleApiSubmit}>
              <Stack gap="md">
                <Title order={4}>Stripe API Keys</Title>
                <TextInput
                  label="Stripe Public Key"
                  value={apiSettings.stripePublicKey}
                  onChange={(e) => setApiSettings({...apiSettings, stripePublicKey: e.target.value})}
                  placeholder="pk_test_..."
                />
                <PasswordInput
                  label="Stripe Secret Key"
                  value={apiSettings.stripeSecretKey}
                  onChange={(e) => setApiSettings({...apiSettings, stripeSecretKey: e.target.value})}
                  placeholder="sk_test_..."
                />
                
                <Divider my="sm" />
                
                <Title order={4}>Handy API Key</Title>
                <PasswordInput
                  label="Handy API Key"
                  value={apiSettings.handyApiKey}
                  onChange={(e) => setApiSettings({...apiSettings, handyApiKey: e.target.value})}
                  placeholder="HAS-..."
                />
                
                <Divider my="sm" />
                
                <Title order={4}>Google Maps API Key</Title>
                <PasswordInput
                  label="Google Maps API Key"
                  value={apiSettings.googleMapsApiKey}
                  onChange={(e) => setApiSettings({...apiSettings, googleMapsApiKey: e.target.value})}
                />
                
                <Group justify="flex-end">
                  <Button type="submit">Save API Settings</Button>
                </Group>
              </Stack>
            </form>
          </Tabs.Panel>
        </Tabs>
      </Card>
    </div>
  );
}

function TwoFactorAuthSection() {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  useEffect(() => {
    // Check if 2FA is enabled for the current user
    const check2FAStatus = async () => {
      try {
        const response = await fetch('/api/auth/two-factor/status');
        const data = await response.json();
        setIs2FAEnabled(data.enabled);
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking 2FA status:', error);
        setIsLoading(false);
      }
    };

    check2FAStatus();
  }, []);

  const handleSetup2FA = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/two-factor/setup');
      const data = await response.json();
      
      if (data.qrCode && data.secret) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setIsSetupModalOpen(true);
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      notifications.show({
        title: "Error",
        message: "Failed to set up 2FA",
        color: "red"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    try {
      if (!token || !secret) return;

      setIsLoading(true);
      const response = await fetch('/api/auth/two-factor/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, secret }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIs2FAEnabled(true);
        setIsSetupModalOpen(false);
        setBackupCodes(data.backupCodes || []);
        setShowBackupCodes(true);
        
        notifications.show({
          title: "Success",
          message: "2FA enabled successfully",
          color: "green"
        });
      } else {
        notifications.show({
          title: "Error",
          message: data.error || "Invalid verification code",
          color: "red"
        });
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      notifications.show({
        title: "Error",
        message: "Failed to verify 2FA",
        color: "red"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/two-factor/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: '' }), // In a real app, you would ask for the password
      });

      const data = await response.json();
      
      if (data.success) {
        setIs2FAEnabled(false);
        notifications.show({
          title: "Success",
          message: "2FA disabled successfully",
          color: "green"
        });
      } else {
        notifications.show({
          title: "Error",
          message: data.error || "Failed to disable 2FA",
          color: "red"
        });
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      notifications.show({
        title: "Error",
        message: "Failed to disable 2FA",
        color: "red"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {is2FAEnabled ? (
        <div>
          <Text color="green" mb="sm">Two-factor authentication is enabled.</Text>
          <Button 
            variant="outline" 
            color="red" 
            onClick={handleDisable2FA}
            loading={isLoading}
          >
            Disable 2FA
          </Button>
        </div>
      ) : (
        <div>
          <Text color="red" mb="sm">Two-factor authentication is not enabled.</Text>
          <Button 
            variant="outline" 
            onClick={handleSetup2FA}
            loading={isLoading}
          >
            Enable 2FA
          </Button>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {isSetupModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Set up Two-Factor Authentication</h2>
            <p className="mb-4">Scan this QR code with your authenticator app (like Google Authenticator, Authy, or Microsoft Authenticator).</p>
            
            {qrCode && (
              <div className="flex justify-center mb-4">
                <img src={qrCode} alt="QR Code for 2FA" className="w-48 h-48" />
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Enter the 6-digit code from your app</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="000000"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsSetupModalOpen(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify2FA}
                className="px-4 py-2 bg-blue-500 text-white rounded"
                disabled={!token || token.length !== 6 || isLoading}
              >
                {isLoading ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Codes Modal */}
      {showBackupCodes && backupCodes.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Backup Codes</h2>
            <p className="mb-4">Save these backup codes in a secure place. You can use them to sign in if you lose access to your authenticator app.</p>
            
            <div className="bg-gray-100 p-4 rounded mb-4">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div key={index} className="font-mono">{code}</div>
                ))}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">Each code can only be used once. If you use a backup code to sign in, you'll get a new set of codes.</p>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowBackupCodes(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 