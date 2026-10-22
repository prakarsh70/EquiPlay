import { TournamentTeam, GroupId } from '../types/tournament';

export const SEEDED_TOURNAMENT_TEAMS: TournamentTeam[] = [
  // GROUP A
  {
    id: 'team-6',
    teamNumber: 6,
    player1: 'Chandan',
    player2: 'Abhijeet',
    group: 'A',
  },
  {
    id: 'team-11',
    teamNumber: 11,
    player1: 'Mayur',
    player2: 'Srinivas',
    group: 'A',
  },
  {
    id: 'team-14',
    teamNumber: 14,
    player1: 'Kartik',
    player2: 'Shantanu',
    group: 'A',
  },
  {
    id: 'team-27',
    teamNumber: 27,
    player1: 'Vasantha',
    player2: 'Mani',
    group: 'A',
  },

  // GROUP B
  {
    id: 'team-7',
    teamNumber: 7,
    player1: 'Meeta',
    player2: 'Abhinav',
    group: 'B',
  },
  {
    id: 'team-12',
    teamNumber: 12,
    player1: 'Ashish',
    player2: 'Tarang',
    group: 'B',
  },
  {
    id: 'team-23',
    teamNumber: 23,
    player1: 'Tanay',
    player2: 'Rohit',
    group: 'B',
  },
  {
    id: 'team-16',
    teamNumber: 16,
    player1: 'Sam',
    player2: 'Pranit',
    group: 'B',
  },

  // GROUP C
  {
    id: 'team-10',
    teamNumber: 10,
    player1: 'Sangram',
    player2: 'Rahul',
    alias: 'LM Warriors',
    group: 'C',
  },
  {
    id: 'team-13',
    teamNumber: 13,
    player1: 'Mohit',
    player2: 'Rajat',
    group: 'C',
  },
  {
    id: 'team-17',
    teamNumber: 17,
    player1: 'Akash',
    player2: 'Prakash',
    group: 'C',
  },
  {
    id: 'team-20',
    teamNumber: 20,
    player1: 'Ayush',
    player2: 'Abhishek',
    group: 'C',
  },

  // GROUP D
  {
    id: 'team-1',
    teamNumber: 1,
    player1: 'Brajesh',
    player2: 'Sachin',
    alias: 'Tyrant-turtles',
    group: 'D',
  },
  {
    id: 'team-21',
    teamNumber: 21,
    player1: 'Sandip',
    player2: 'Abhijit',
    group: 'D',
  },
  {
    id: 'team-25',
    teamNumber: 25,
    player1: 'Sarvanan',
    player2: 'Kshitij',
    group: 'D',
  },
  {
    id: 'team-29',
    teamNumber: 29,
    player1: 'Rajeev',
    player2: 'Siddhant',
    group: 'D',
  },

  // GROUP E
  {
    id: 'team-2',
    teamNumber: 2,
    player1: 'Ajay',
    player2: 'Omkar',
    alias: 'OMAJination',
    group: 'E',
  },
  {
    id: 'team-32',
    teamNumber: 32,
    player1: 'Shreenik',
    player2: 'Ajit',
    group: 'E',
  },
  {
    id: 'team-19',
    teamNumber: 19,
    player1: 'Bhusan',
    player2: 'Sarang',
    group: 'E',
  },
  {
    id: 'team-31',
    teamNumber: 31,
    player1: 'Akshay',
    player2: 'Prakash',
    group: 'E',
  },

  // GROUP F
  {
    id: 'team-3',
    teamNumber: 3,
    player1: 'Rajesh',
    player2: 'Adarsh',
    group: 'F',
  },
  {
    id: 'team-4',
    teamNumber: 4,
    player1: 'Mandar',
    player2: 'Anurag',
    group: 'F',
  },
  {
    id: 'team-18',
    teamNumber: 18,
    player1: 'Sandeep',
    player2: 'Mahesh',
    group: 'F',
  },
  {
    id: 'team-26',
    teamNumber: 26,
    player1: 'Sameer',
    player2: 'Subhash',
    group: 'F',
  },

  // GROUP G
  {
    id: 'team-15',
    teamNumber: 15,
    player1: 'Sunny',
    player2: 'Somesh',
    group: 'G',
  },
  {
    id: 'team-28',
    teamNumber: 28,
    player1: 'Arpit',
    player2: 'Rajan',
    group: 'G',
  },
  {
    id: 'team-30',
    teamNumber: 30,
    player1: 'Subham',
    player2: 'Prathamesh',
    group: 'G',
  },
  {
    id: 'team-22',
    teamNumber: 22,
    player1: 'Harsh',
    player2: 'Shreyas',
    group: 'G',
  },

  // GROUP H
  {
    id: 'team-5',
    teamNumber: 5,
    player1: 'Ketan',
    player2: 'Swapnil',
    group: 'H',
  },
  {
    id: 'team-8',
    teamNumber: 8,
    player1: 'Vaibhav',
    player2: 'Abhimanyu',
    alias: 'Mighty Tigers',
    group: 'H',
  },
  {
    id: 'team-9',
    teamNumber: 9,
    player1: 'Unmesh',
    player2: 'Digvijay',
    group: 'H',
  },
  {
    id: 'team-24',
    teamNumber: 24,
    player1: 'Manoj',
    player2: 'Deepti',
    group: 'H',
  },
];

export const TOURNAMENT_GROUPS: GroupId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
