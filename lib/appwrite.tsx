import { CreateUserParams, SignInParams } from '@/type';
import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage,
} from 'react-native-appwrite';

export const appwriteConfig = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'http://localhost/v1',
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || 'your-project-id',
  platform: process.env.EXPO_PUBLIC_APPWRITE_PLATFORM || 'react-native',
  projectName:
    process.env.EXPO_PUBLIC_APPWRITE_PROJECT_NAME || 'Food Delivery App',
  databaseId:
    process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || 'your-database-id',
  bucketId: process.env.EXPO_PUBLIC_APPWRITE_BUCKETS_ID || 'buckets',
  userCollectionId: 'user',
  categoriesCollectionId:'categories',
  menuCollectionId:'menu',
  customizationsCollectionId:'customizations',
  menuCustomizationsCollectionId:'menu_customizations'
};

export const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setPlatform(appwriteConfig.platform);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
const avatars = new Avatars(client);

export const createUser = async ({
  name,
  email,
  password,
}: CreateUserParams) => {
  try {
    const newAccount = await account.create(ID.unique(), email, password, name);
    if (!newAccount) throw Error;
    await signIn({ email, password });

    const avatarUrl = avatars.getInitialsURL(name);

    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email,
        name,
        avatar: avatarUrl,
      }
    );

    return newUser;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export const signIn = async ({ email, password }: SignInParams) => {
  try {
    const session = await account.createEmailPasswordSession(email, password);
  } catch (error) {
    throw new Error(error as string);
  }
};

export const getCurrentUser = async () => {
  try {
    const currentAccount = await account.get();
    if (!currentAccount) throw Error;
    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal('accountId', [currentAccount.$id])]
    );
    if (!currentUser) throw Error;
    return currentUser.documents[0];
  } catch (error) {
    console.log('Error fetching current user:', error);
    throw new Error(error as string);
  }
};
