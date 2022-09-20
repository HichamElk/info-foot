import {
    Heading,
    Avatar,
    Box,
    Center,
    Image,
    Flex,
    Text,
    Stack,
    Button,
    useColorModeValue,
    Spinner
} from '@chakra-ui/react';
import React, {useEffect} from 'react';
import { useState } from 'react';
import axios from 'axios';


const FootballClub = (props) => {
    const [isStatsLoading, setStatsLoading] = useState(true);

    const [data, setData] = useState();

    const fetchTeamStats = {
        method: 'GET',
        url: 'https://api-football-v1.p.rapidapi.com/v3/teams/statistics',
        params: {
            league: props.league_id,
            season: 2021,
            team: props.team_id
        },
        headers: {
            'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
            'X-RapidAPI-Key': '91eeb26ed8msh8447d341df76518p1a7653jsna3db505351af'
        }
    }

    useEffect(() => {
        axios.request(fetchTeamStats).then(response => {
                setData(response.data);
                setStatsLoading(false);
            }
        ).catch(function (error) {
            console.error(error);
        });
    }, []);

    if(isStatsLoading) {
        return <Center><Spinner size='xl'/></Center>
    }
    console.log(data);

    const firstHalf = ['0-15', '16-30', '31-45']
    const secondHalf = ['46-60', '61-75', '76-90']

    const goalsAgainst = data['response']['goals'].against.minute
    const goalsFor = data['response']['goals'].for.minute

    function addGoals(half, data) {
        let count= 0
        for (let time in half) {
            count= count + data[half[time]].total
        }
        return count
    }

    let firstHalfAgainst= addGoals(firstHalf, goalsAgainst)
    let secondHalfAgainst= addGoals(secondHalf, goalsAgainst)

    let firstHalfFor= addGoals(firstHalf, goalsFor)
    let secondHalfFor= addGoals(secondHalf, goalsFor)


    return (
        <Center >
            <Box
                w={'full'}
                rounded={'md'}
                overflow={'hidden'}>
                <Image
                    h={'120px'}
                    w={'full'}
                    bg={'black'}
                    objectFit={'cover'}
                />
                <Flex justify={'center'} mt={-12}>
                    <Avatar
                        size={'xl'}
                        src={
                            data['response']['team']['logo']
                        }
                        alt={data['response']['team']['name']}
                        css={{
                            border: '2px solid white',
                        }}
                    />
                </Flex>

                <Box p={6}>
                    <Stack spacing={0} align={'center'} >
                        <Heading fontSize={'2xl'} fontWeight={500} fontFamily={'body'} >
                            {data['response']['team']['name']}
                        </Heading>
                        <Text color={'gray.500'}>{'Saison : '+data['response']['league']['season']}</Text>
                    </Stack>
                    <Stack direction={'row'} justify={'center'} spacing={6}>
                        <Stack spacing={0} align={'center'}>
                            <Text fontWeight={600} >Buts</Text>
                            <Text  fontWeight={500} color={'gray.600'}>
                                1er mi-Temps : {firstHalfAgainst}
                                <br/>
                                2nd mi-Temps : {secondHalfAgainst}
                            </Text>
                        </Stack>
                        <Stack spacing={0} align={'center'}>
                            <Text fontWeight={600} >Buts encaissés</Text>
                            <Text  fontWeight={500} color={'gray.600'}>
                                1er mi-Temps : {firstHalfFor}
                                <br/>
                                2nd mi-Temps : {secondHalfFor}
                            </Text>
                        </Stack>
                    </Stack>

                </Box>
            </Box>
        </Center>
    );



}

export default FootballClub;