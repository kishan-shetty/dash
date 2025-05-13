'use client'

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CircleLoader } from "react-spinners";
import { Switch } from "@/components/ui/switch" // Import Switch

// Supabase setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Candidate {
    id: string;
    full_name: string;
    email: string;
    contact_number: string;
    gender?: string;
    qualification: string;
    year_of_completion: string;
    college_name: string;
    hod_name?: string;
    hod_contact?: string;
    hod_email?: string;
    batch: string;
    reference: string;
    whatsapp_sent: boolean;
    phone_called: boolean;
    attended: boolean;
    attended_intro: boolean;
    created_at: string;
}

const AdminDashboard = () => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch candidates data from Supabase
    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from('candidates')
                    .select('*')
                    .order('created_at', { ascending: false }); // Order by creation time

                if (fetchError) {
                    setError(`Error fetching candidates: ${fetchError.message}`);
                } else {
                    setCandidates(data || []);
                }
            } catch (err: any) {
                setError(`An unexpected error occurred: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchCandidates();
    }, []);

    // Function to update candidate status (whatsapp, phone call, attendance)
    const updateCandidateStatus = async (
        id: string,
        field: keyof Candidate,
        value: boolean
    ) => {
        try {
            const { error: updateError } = await supabase
                .from('candidates')
                .update({ [field]: value })
                .eq('id', id);

            if (updateError) {
                setError(`Error updating ${field}: ${updateError.message}`);
            } else {
                // Update the state to reflect the change
                setCandidates(prevCandidates =>
                    prevCandidates.map(candidate =>
                        candidate.id === id ? { ...candidate, [field]: value } : candidate
                    )
                );
            }
        } catch (err: any) {
            setError(`An unexpected error occurred: ${err.message}`);
        }
    };



    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white">Candidate Dashboard</h1>

            {error && (
                <Alert variant="destructive" className="mb-4 md:mb-6">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <CircleLoader color="#000" loading={loading} />
                    <span className="ml-2 text-gray-500 dark:text-gray-400">Loading data...</span>
                </div>
            ) : (
                <Card className="shadow-lg">
                    
                    <CardContent className="p-0">
                        <ScrollArea className="w-full">
                            <div className="w-full">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[150px] md:w-[180px]">Date Applied</TableHead>
                                            <TableHead className="w-[100px] md:w-[120px]">Name</TableHead>
                                            <TableHead className="w-[180px] md:w-[220px]">Email</TableHead>
                                            <TableHead className="w-[120px] md:w-[140px]">Contact</TableHead>
                                            <TableHead className="w-[180px] md:w-[220px]">Qualification</TableHead>
                                            <TableHead className="w-[120px] md:w-[140px]">Year</TableHead>
                                            <TableHead className="w-[150px] md:w-[180px]">Batch</TableHead>
                                            <TableHead className="w-[120px] md:w-[140px] text-center">WhatsApp</TableHead>
                                            <TableHead className="w-[120px] md:w-[140px] text-center">Phone Call</TableHead>
                                            <TableHead className="w-[120px] md:w-[140px] text-center">Attended</TableHead>
                                            <TableHead className="w-[150px] md:w-[180px] text-center">Intro</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {candidates.map((candidate) => (
                                            <TableRow key={candidate.id}>
                                                <TableCell>{new Date(candidate.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell className="font-medium">{candidate.full_name}</TableCell>
                                                <TableCell>{candidate.email}</TableCell>
                                                <TableCell>{candidate.contact_number}</TableCell>
                                                <TableCell>{candidate.qualification}</TableCell>
                                                <TableCell>{candidate.year_of_completion}</TableCell>
                                                <TableCell>{candidate.batch}</TableCell>
                                                <TableCell className="text-center">
                                                    <Switch
                                                        checked={candidate.whatsapp_sent}
                                                        onCheckedChange={(checked) =>
                                                            updateCandidateStatus(candidate.id, 'whatsapp_sent', checked)
                                                        }
                                                        className=""
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Switch
                                                        checked={candidate.phone_called}
                                                        onCheckedChange={(checked) =>
                                                            updateCandidateStatus(candidate.id, 'phone_called', checked)
                                                        }
                                                        className=""
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Switch
                                                        checked={candidate.attended}
                                                        onCheckedChange={(checked) =>
                                                            updateCandidateStatus(candidate.id, 'attended', checked)
                                                        }
                                                        className=""
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Switch
                                                        checked={candidate.attended_intro}
                                                        onCheckedChange={(checked) =>
                                                            updateCandidateStatus(candidate.id, 'attended_intro', checked)
                                                        }
                                                        className=""
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default AdminDashboard;
