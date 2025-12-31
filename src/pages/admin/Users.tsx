
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Search, UserPlus, Shield, ShieldCheck, User as UserIcon } from "lucide-react";
import LoadingState from "@/components/admin/LoadingState";
import ErrorState from "@/components/admin/ErrorState";
import AccessDenied from "@/components/admin/AccessDenied";

type UserRole = 'user' | 'admin' | 'superadmin';

type User = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  created_at: string;
  role: UserRole;
};

const Users = () => {
  const { isAdmin, isSuperadmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();

      // Set up real-time subscription for user changes
      const channel = supabase
        .channel('profiles-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'profiles' },
          () => {
            console.log('Profiles changed, refetching...');
            fetchUsers();
          }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'user_roles' },
          () => {
            console.log('User roles changed, refetching...');
            fetchUsers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching users...");
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, is_admin, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Map roles to users - priority: superadmin > admin > user
      const usersWithRoles = (profiles || []).map(profile => {
        const userRoles = roles?.filter(r => r.user_id === profile.id).map(r => r.role) || [];
        let role: UserRole = 'user';
        
        if (userRoles.includes('superadmin')) {
          role = 'superadmin';
        } else if (userRoles.includes('admin') || profile.is_admin) {
          role = 'admin';
        }
        
        return { ...profile, role };
      });
      
      console.log("Users fetched:", usersWithRoles.length);
      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setError(error.message || "Failed to load users");
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      setUpdatingUserId(userId);
      
      // First, remove all existing admin/superadmin roles for this user
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .in('role', ['admin', 'superadmin']);

      if (deleteError) throw deleteError;

      // Update is_admin in profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_admin: newRole !== 'user' })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Add new role if not 'user'
      if (newRole === 'admin' || newRole === 'superadmin') {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (insertError) throw insertError;
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole, is_admin: newRole !== 'user' } : user
      ));

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });
    } catch (error: any) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive"
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return (
          <Badge className="bg-purple-500 hover:bg-purple-600">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Superadmin
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <UserIcon className="h-3 w-3 mr-1" />
            User
          </Badge>
        );
    }
  };

  const filteredUsers = users.filter(user => 
    (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isAdmin) {
    return <AccessDenied />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">
            View and manage users in the system
            {isSuperadmin && " • You can assign admin and superadmin roles"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users..."
              className="pl-10 w-full min-w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              className="nectarine-gradient hover:opacity-90 transition-opacity w-full sm:w-auto"
              onClick={() => toast({
                title: "Feature Coming Soon",
                description: "User invitation functionality will be available soon.",
              })}
            >
              <UserPlus className="mr-2 h-4 w-4" /> Invite User
            </Button>
            <Button 
              variant="outline"
              className="w-full sm:w-auto"
              onClick={fetchUsers}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState 
                message={error} 
                onRetry={fetchUsers}
              />
            ) : filteredUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    {isSuperadmin && <TableHead className="text-right">Change Role</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || 'N/A'}</TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      {isSuperadmin && (
                        <TableCell className="text-right">
                          <Select
                            value={user.role}
                            onValueChange={(value: UserRole) => updateUserRole(user.id, value)}
                            disabled={updatingUserId === user.id}
                          >
                            <SelectTrigger className="w-[140px] ml-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">
                                <div className="flex items-center">
                                  <UserIcon className="h-3 w-3 mr-2" />
                                  User
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center">
                                  <Shield className="h-3 w-3 mr-2" />
                                  Admin
                                </div>
                              </SelectItem>
                              <SelectItem value="superadmin">
                                <div className="flex items-center">
                                  <ShieldCheck className="h-3 w-3 mr-2" />
                                  Superadmin
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center p-12">
                <p className="text-muted-foreground mb-4">No users found matching your search</p>
                {searchTerm && 
                  <Button variant="outline" onClick={() => setSearchTerm("")}>
                    Clear Search
                  </Button>
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Users;
