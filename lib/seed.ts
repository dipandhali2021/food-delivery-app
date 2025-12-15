import { ID } from "react-native-appwrite";
import { appwriteConfig, databases, storage } from "./appwrite";
import dummyData from "./data";
import * as FileSystem from "expo-file-system/legacy";

interface Category {
  name: string;
  description: string;
}

interface Customization {
  name: string;
  price: number;
  type: "topping" | "side" | "size" | "crust" | string;
}

interface MenuItem {
  name: string;
  description: string;
  image_url: string;
  price: number;
  rating: number;
  calories: number;
  protein: number;
  category_name: string;
  customizations: string[];
}

interface DummyData {
  categories: Category[];
  customizations: Customization[];
  menu: MenuItem[];
}

const data = dummyData as DummyData;

async function clearAll(collectionId: string): Promise<void> {
  try {
    console.log(`🧹 Clearing collection: ${collectionId}...`);
    const list = await databases.listDocuments(
      appwriteConfig.databaseId,
      collectionId
    );

    if (list.total === 0) {
      console.log(`   - Collection ${collectionId} is already empty.`);
      return;
    }

    await Promise.all(
      list.documents.map(async (doc) => {
        await databases.deleteDocument(appwriteConfig.databaseId, collectionId, doc.$id);
        console.log(`   - Deleted doc: ${doc.$id}`);
      })
    );
    console.log(`✅ Collection ${collectionId} cleared.`);
  } catch (error) {
    console.error(`❌ Error clearing collection ${collectionId}:`, error);
    throw error;
  }
}

async function clearStorage(): Promise<void> {
  try {
    console.log(`🧹 Clearing storage bucket: ${appwriteConfig.bucketId}...`);
    const list = await storage.listFiles(appwriteConfig.bucketId);

    if (list.total === 0) {
      console.log(`   - Storage bucket is already empty.`);
      return;
    }

    await Promise.all(
      list.files.map(async (file: any) => {
        await storage.deleteFile(appwriteConfig.bucketId, file.$id);
        console.log(`   - Deleted file: ${file.$id}`);
      })
    );
    console.log(`✅ Storage cleared.`);
  } catch (error) {
    console.error(`❌ Error clearing storage:`, error);
    throw error;
  }
}

async function uploadImageToStorage(imageUrl: string) {
  const fileName =
    imageUrl.split("/").pop() || `img-${Date.now()}.png`;

  const localUri = FileSystem.cacheDirectory + fileName;

  try {
    // 1️⃣ Download image locally
    const download = await FileSystem.downloadAsync(
      imageUrl,
      localUri
    );

    if (download.status !== 200) {
      throw new Error("Image download failed");
    }

    // 2️⃣ Get file info (size required)
    const fileInfo = await FileSystem.getInfoAsync(localUri);

    if (!fileInfo.exists || !fileInfo.size) {
      throw new Error("Downloaded file not found");
    }

    // 3️⃣ Upload to Appwrite
    const file = await storage.createFile(
      appwriteConfig.bucketId,
      ID.unique(),
      {
        uri: localUri,
        name: fileName,
        type: "image/png",
        size: fileInfo.size, // REQUIRED
      }
    );

    return storage.getFileViewURL(appwriteConfig.bucketId, file.$id);
  } finally {
    // 4️⃣ Cleanup local file
    try {
      await FileSystem.deleteAsync(localUri, { idempotent: true });
      console.log("🧹 Local file deleted");
    } catch (e) {
      console.warn("Cleanup failed:", e);
    }
  }
}
async function seed(): Promise<void> {
  console.log("🚀 Starting seeding process...");

  try {
    // 1. Clear all
    console.log("\n--- STEP 1: CLEANUP ---");
    await clearAll(appwriteConfig.categoriesCollectionId);
    await clearAll(appwriteConfig.customizationsCollectionId);
    await clearAll(appwriteConfig.menuCollectionId);
    await clearAll(appwriteConfig.menuCustomizationsCollectionId);
    await clearStorage();

    // 2. Create Categories
    console.log("\n--- STEP 2: CATEGORIES ---");
    const categoryMap: Record<string, string> = {};
    for (const cat of data.categories) {
      console.log(`Creating category: ${cat.name}`);
      const doc = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.categoriesCollectionId,
        ID.unique(),
        cat
      );
      categoryMap[cat.name] = doc.$id;
      console.log(`   - Created ID: ${doc.$id}`);
    }

    // 3. Create Customizations
    console.log("\n--- STEP 3: CUSTOMIZATIONS ---");
    const customizationMap: Record<string, string> = {};
    for (const cus of data.customizations) {
      console.log(`Creating customization: ${cus.name}`);
      const doc = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.customizationsCollectionId,
        ID.unique(),
        {
          name: cus.name,
          price: cus.price,
          type: cus.type,
        }
      );
      customizationMap[cus.name] = doc.$id;
      console.log(`   - Created ID: ${doc.$id}`);
    }

    // 4. Create Menu Items
    console.log("\n--- STEP 4: MENU ITEMS ---");
    const menuMap: Record<string, string> = {};
    for (const item of data.menu) {
      console.log(`\nProcessing Item: ${item.name}`);
      
      // Upload Image
      const uploadedImage = await uploadImageToStorage(item.image_url);

      // Create Menu Document
      console.log(`   - Creating menu document...`);
      const doc = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.menuCollectionId,
        ID.unique(),
        {
          name: item.name,
          description: item.description,
          image_url: uploadedImage,
          price: item.price,
          rating: item.rating,
          calories: item.calories,
          protein: item.protein,
          categories: categoryMap[item.category_name],
        }
      );
      menuMap[item.name] = doc.$id;
      console.log(`   ✅ Menu Item Created: ${doc.$id}`);

      // 5. Create menu_customizations
      if (item.customizations && item.customizations.length > 0) {
        console.log(`   - Linking ${item.customizations.length} customizations...`);
        for (const cusName of item.customizations) {
          if (!customizationMap[cusName]) {
             console.warn(`   ⚠️ Warning: Customization '${cusName}' not found in map. Skipping.`);
             continue;
          }

          await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.menuCustomizationsCollectionId,
            ID.unique(),
            {
              menu: doc.$id,
              customizations: customizationMap[cusName],
            }
          );
        }
        console.log(`   - Customizations linked.`);
      }
    }

    console.log("\n✅✅✅ SEEDING COMPLETE SUCCESSFULLY ✅✅✅");
  } catch (error) {
    console.error("\n❌❌❌ SEEDING FAILED ❌❌❌");
    console.error(error);
  }
}

export default seed;