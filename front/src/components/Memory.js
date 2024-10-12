import React, { useState, useEffect } from 'react';
import { Box, Title, Text, Paper, Loader, SimpleGrid, Image } from '@mantine/core';
import { useParams } from 'react-router-dom';

function Memory() {
    const { id } = useParams();
    const [memory, setMemory] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`http://localhost:8000/memories/${id}`)
            .then(response => response.json())
            .then(data => {
                setMemory(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching memory:', error);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center' }}><Loader /></Box>;
    if (!memory) return <Text>Memory not found.</Text>;

    return (
        <Paper shadow="md" p="md" sx={{ maxWidth: 800, margin: 'auto' }}>
            <Title order={2} mb="md">{memory.name}</Title>
            <Text>{memory.texts}</Text>
            
            {memory.images && memory.images.length > 0 && (
                <Box mt="md">
                    <Title order={4} mb="sm">Images</Title>
                    <SimpleGrid cols={3}>
                        {memory.images.map((img, index) => (
                            <Image
                                key={index}
                                src={`data:image/jpeg;base64,${img}`}
                                alt={`Memory image ${index + 1}`}
                                fit="cover"
                            />
                        ))}
                    </SimpleGrid>
                </Box>
            )}
        </Paper>
    );
}

export default Memory;
