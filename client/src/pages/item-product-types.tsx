import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { 
  PlusIcon, 
  SearchIcon, 
  MoreHorizontalIcon, 
  PencilIcon, 
  TrashIcon,
  TagIcon
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const typeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type TypeFormValues = z.infer<typeof typeFormSchema>;

interface ItemProductType {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}

export default function ItemProductTypes() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ItemProductType | null>(null);

  // Fetch product types
  const { data: productTypes = [], isLoading: isLoadingTypes } = useQuery<ItemProductType[]>({
    queryKey: ['/api/item-product-types'],
  });

  // Create form
  const createForm = useForm<TypeFormValues>({
    resolver: zodResolver(typeFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Edit form
  const editForm = useForm<TypeFormValues>({
    resolver: zodResolver(typeFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Create type mutation
  const createTypeMutation = useMutation({
    mutationFn: async (data: TypeFormValues) => {
      const res = await apiRequest("POST", "/api/item-product-types", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/item-product-types"] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Success",
        description: "Product Type created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update type mutation
  const updateTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TypeFormValues }) => {
      const res = await apiRequest("PUT", `/api/item-product-types/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/item-product-types"] });
      setIsEditDialogOpen(false);
      setSelectedType(null);
      toast({
        title: "Success",
        description: "Product Type updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete type mutation
  const deleteTypeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/item-product-types/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/item-product-types"] });
      setIsDeleteDialogOpen(false);
      setSelectedType(null);
      toast({
        title: "Success",
        description: "Product Type deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    createForm.reset();
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (type: ItemProductType) => {
    setSelectedType(type);
    editForm.reset({
      name: type.name,
      description: type.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (type: ItemProductType) => {
    setSelectedType(type);
    setIsDeleteDialogOpen(true);
  };

  const onCreateSubmit = (data: TypeFormValues) => {
    createTypeMutation.mutate(data);
  };

  const onEditSubmit = (data: TypeFormValues) => {
    if (selectedType) {
      updateTypeMutation.mutate({ id: selectedType.id, data });
    }
  };

  const filteredTypes = productTypes.filter((type: ItemProductType) =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <TagIcon className="h-8 w-8 text-blue-600" />
              Item Product Types
            </h1>
            <p className="text-muted-foreground">
              Manage product types to categorize your products
            </p>
          </div>
          <Button 
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Type
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Types List</CardTitle>
                <CardDescription>
                  Manage all your product types here
                </CardDescription>
              </div>
              <div className="relative w-64">
                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingTypes ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">Loading...</TableCell>
                    </TableRow>
                  ) : filteredTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-gray-400">No product types found</TableCell>
                    </TableRow>
                  ) : filteredTypes.map((type: ItemProductType) => (
                    <TableRow key={type.id}>
                      <TableCell>
                        <div className="font-medium">{type.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {type.description || 'No description'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(type.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(type)}>
                              <PencilIcon className="h-4 w-4 mr-2" />
                              Edit Type
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(type)}
                              className="text-red-600"
                            >
                              <TrashIcon className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <PlusIcon className="h-6 w-6 text-blue-600" />
              Create New Type
            </DialogTitle>
            <DialogDescription className="text-base">
              Add a new product type
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Type Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter type name" {...field} className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter description (optional)" {...field} className="min-h-[100px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={createTypeMutation.isPending} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {createTypeMutation.isPending ? "Creating..." : "Create Type"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <PencilIcon className="h-6 w-6 text-blue-600" />
              Edit Type
            </DialogTitle>
            <DialogDescription className="text-base">
              Update the details for <span className="font-semibold">{selectedType?.name}</span>
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Type Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter type name" {...field} className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter description (optional)" {...field} className="min-h-[100px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={updateTypeMutation.isPending} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {updateTypeMutation.isPending ? "Updating..." : "Update Type"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedType?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (selectedType) {
                  deleteTypeMutation.mutate(selectedType.id);
                }
              }}
              disabled={deleteTypeMutation.isPending}
            >
              {deleteTypeMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
