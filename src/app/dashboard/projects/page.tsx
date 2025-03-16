"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  Title, 
  Text, 
  Button, 
  Group, 
  Badge, 
  ActionIcon, 
  Tooltip, 
  Loader, 
  Center,
  Table,
  Menu,
  Pagination
} from "@mantine/core";
import { 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconDotsVertical, 
  IconEye,
  IconSearch
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProjects();
  }, [activePage]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // In a real app, you would fetch from your API with pagination
      // const response = await fetch(`/api/projects?page=${activePage}&limit=${itemsPerPage}`);
      
      // For now, we'll use mock data
      const mockProjects: Project[] = [
        {
          id: "proj-1",
          name: "Website Redesign",
          description: "Complete redesign of company website",
          status: "in-progress",
          startDate: "2023-01-15",
          endDate: "2023-06-30",
          budget: 15000,
          createdAt: "2023-01-10T00:00:00Z",
          updatedAt: "2023-03-15T00:00:00Z"
        },
        {
          id: "proj-2",
          name: "CRM Implementation",
          description: "Implementation of new CRM system",
          status: "completed",
          startDate: "2022-09-01",
          endDate: "2023-02-28",
          budget: 25000,
          createdAt: "2022-08-15T00:00:00Z",
          updatedAt: "2023-03-01T00:00:00Z"
        },
        {
          id: "proj-3",
          name: "Mobile App Development",
          description: "Develop a mobile app for customers",
          status: "planned",
          startDate: "2023-07-01",
          budget: 35000,
          createdAt: "2023-03-10T00:00:00Z",
          updatedAt: "2023-03-10T00:00:00Z"
        }
      ];
      
      setProjects(mockProjects);
      setTotalPages(Math.ceil(mockProjects.length / itemsPerPage));
    } catch (error) {
      console.error("Error fetching projects:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load projects. Please try again.",
        color: "red"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        // In a real app, you would call your API
        // await fetch(`/api/projects/${id}`, { method: "DELETE" });
        
        // For now, we'll just update the state
        setProjects(projects.filter(project => project.id !== id));
        notifications.show({
          title: "Success",
          message: "Project deleted successfully",
          color: "green"
        });
      } catch (error) {
        console.error("Error deleting project:", error);
        notifications.show({
          title: "Error",
          message: "Failed to delete project. Please try again.",
          color: "red"
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "green";
      case "in-progress":
        return "blue";
      case "planned":
        return "yellow";
      default:
        return "gray";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return "—";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Center style={{ height: "70vh" }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={2}>Projects</Title>
          <Button 
            leftSection={<IconPlus size={16} />} 
            onClick={() => router.push("/dashboard/projects/new")}
          >
            New Project
          </Button>
        </Group>

        {projects.length === 0 ? (
          <Text ta="center" py="xl" c="dimmed">
            No projects found. Create your first project to get started.
          </Text>
        ) : (
          <>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Start Date</Table.Th>
                  <Table.Th>End Date</Table.Th>
                  <Table.Th>Budget</Table.Th>
                  <Table.Th style={{ width: 100 }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {projects.map((project) => (
                  <Table.Tr key={project.id}>
                    <Table.Td>
                      <Text fw={500}>{project.name}</Text>
                      <Text size="xs" c="dimmed">{project.description}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getStatusColor(project.status)} variant="light">
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace("-", " ")}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{formatDate(project.startDate)}</Table.Td>
                    <Table.Td>{formatDate(project.endDate)}</Table.Td>
                    <Table.Td>{formatCurrency(project.budget)}</Table.Td>
                    <Table.Td>
                      <Menu position="bottom-end" shadow="md">
                        <Menu.Target>
                          <ActionIcon>
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item 
                            leftSection={<IconEye size={16} />}
                            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                          >
                            View
                          </Menu.Item>
                          <Menu.Item 
                            leftSection={<IconEdit size={16} />}
                            onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Item 
                            leftSection={<IconTrash size={16} />}
                            color="red"
                            onClick={() => handleDelete(project.id)}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {totalPages > 1 && (
              <Group justify="center" mt="md">
                <Pagination 
                  total={totalPages} 
                  value={activePage} 
                  onChange={setActivePage} 
                />
              </Group>
            )}
          </>
        )}
      </Card>
    </div>
  );
} 