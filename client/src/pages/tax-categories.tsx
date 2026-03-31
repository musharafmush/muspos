
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    PlusIcon,
    SearchIcon,
    MoreHorizontalIcon,
    PencilIcon,
    TrashIcon,
    PercentIcon
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const taxCategoryFormSchema = z.object({
    name: z.string().min(2, "Name is required"),
    rate: z.string().refine(val => !isNaN(Number(val)), "Rate must be a number"),
    hsnCodeRange: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
});

type TaxCategoryFormValues = z.infer<typeof taxCategoryFormSchema>;

interface TaxCategory {
    id: number;
    name: string;
    rate: number;
    hsnCodeRange?: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
}

export default function TaxCategories() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<TaxCategory | null>(null);

    // Fetch Tax Categories
    const { data: categories = [] } = useQuery<TaxCategory[]>({
        queryKey: ['/api/tax-categories'],
    });

    // Create form
    const createForm = useForm<TaxCategoryFormValues>({
        resolver: zodResolver(taxCategoryFormSchema),
        defaultValues: {
            name: "",
            rate: "0",
            hsnCodeRange: "",
            description: "",
            isActive: true,
        },
    });

    // Edit form
    const editForm = useForm<TaxCategoryFormValues>({
        resolver: zodResolver(taxCategoryFormSchema),
        defaultValues: {
            name: "",
            rate: "0",
            hsnCodeRange: "",
            description: "",
            isActive: true,
        },
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (data: TaxCategoryFormValues) => {
            const payload = {
                ...data,
                rate: parseFloat(data.rate),
            };
            const res = await apiRequest("POST", "/api/tax-categories", payload);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tax-categories"] });
            setIsCreateDialogOpen(false);
            createForm.reset();
            toast({
                title: "Success",
                description: "Tax Category created successfully",
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

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: TaxCategoryFormValues }) => {
            const payload = {
                ...data,
                rate: parseFloat(data.rate),
            };
            const res = await apiRequest("PUT", `/api/tax-categories/${id}`, payload);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tax-categories"] });
            setIsEditDialogOpen(false);
            setSelectedCategory(null);
            toast({
                title: "Success",
                description: "Tax Category updated successfully",
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

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await apiRequest("DELETE", `/api/tax-categories/${id}`);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tax-categories"] });
            setIsDeleteDialogOpen(false);
            setSelectedCategory(null);
            toast({
                title: "Success",
                description: "Tax Category deleted successfully",
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

    const handleEdit = (category: TaxCategory) => {
        setSelectedCategory(category);
        editForm.reset({
            name: category.name,
            rate: category.rate.toString(),
            hsnCodeRange: category.hsnCodeRange || "",
            description: category.description || "",
            isActive: category.isActive,
        });
        setIsEditDialogOpen(true);
    };

    const handleDelete = (category: TaxCategory) => {
        setSelectedCategory(category);
        setIsDeleteDialogOpen(true);
    };

    const onCreateSubmit = (data: TaxCategoryFormValues) => {
        createMutation.mutate(data);
    };

    const onEditSubmit = (data: TaxCategoryFormValues) => {
        if (selectedCategory) {
            updateMutation.mutate({ id: selectedCategory.id, data });
        }
    };

    const filteredCategories = categories.filter((cat: TaxCategory) =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <PercentIcon className="h-8 w-8 text-blue-600" />
                            Tax Categories
                        </h1>
                        <p className="text-muted-foreground">
                            Manage GST tax rate categories
                        </p>
                    </div>
                    <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Category
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Category List</CardTitle>
                                <CardDescription>All configured tax categories</CardDescription>
                            </div>
                            <div className="relative w-64">
                                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search categories..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Rate (%)</TableHead>
                                    <TableHead>HSN Range</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCategories.map((cat: TaxCategory) => (
                                    <TableRow key={cat.id}>
                                        <TableCell className="font-medium">{cat.name}</TableCell>
                                        <TableCell>{cat.rate}%</TableCell>
                                        <TableCell>{cat.hsnCodeRange || '-'}</TableCell>
                                        <TableCell>{cat.description || '-'}</TableCell>
                                        <TableCell>
                                            <div className={`px-2 py-1 rounded-full text-xs w-fit ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {cat.isActive ? 'Active' : 'Inactive'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontalIcon className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(cat)}>
                                                        <PencilIcon className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDelete(cat)} className="text-red-600">
                                                        <TrashIcon className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredCategories.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            No tax categories found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add Tax Category</DialogTitle>
                    </DialogHeader>
                    <Form {...createForm}>
                        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                            <FormField
                                control={createForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name *</FormLabel>
                                        <FormControl><Input placeholder="e.g. Standard Rate" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={createForm.control}
                                name="rate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tax Rate (%) *</FormLabel>
                                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={createForm.control}
                                name="hsnCodeRange"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>HSN Code Range</FormLabel>
                                        <FormControl><Input placeholder="e.g. 1000-2000" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={createForm.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl><Textarea {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={createForm.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>
                                                Active
                                            </FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                                    Create
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Tax Category</DialogTitle>
                    </DialogHeader>
                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                            <FormField
                                control={editForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name *</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="rate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tax Rate (%) *</FormLabel>
                                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="hsnCodeRange"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>HSN Code Range</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl><Textarea {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>
                                                Active
                                            </FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={updateMutation.isPending}>
                                    {updateMutation.isPending && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Tax Category</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedCategory?.name}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (selectedCategory) {
                                    deleteMutation.mutate(selectedCategory.id);
                                }
                            }}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
