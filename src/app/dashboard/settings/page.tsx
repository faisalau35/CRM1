"use client";

import { useState } from "react";
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
  IconTrash
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
                <Button variant="outline">Enable 2FA</Button>
                
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