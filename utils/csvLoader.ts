import { Hall, Brand } from '../types';

export const parseBrandsCSV = async (csvUrl: string, skeletonHalls: Hall[]): Promise<Hall[]> => {
  try {
    const response = await fetch(csvUrl);
    const text = await response.text();
    
    // Simple CSV Parser
    // Assumes standard format: HallCode,Booth,BrandName,BrandID,Description,ModelName,IsKeyModel,Tag
    const rows = text.split('\n').slice(1).filter(r => r.trim() !== '');
    
    // Clone skeleton to avoid mutating original reference directly during partial updates
    const updatedHalls = skeletonHalls.map(h => ({
      ...h,
      brands: [] as Brand[] // Clear brands to populate from CSV
    }));

    const brandMap = new Map<string, Brand>();

    rows.forEach(row => {
      const cols = row.split(',').map(c => c.trim());
      if (cols.length < 4) return;

      const [hallCode, booth, brandName, brandId, description, modelName, isKeyStr, tag] = cols;

      // Find the target hall
      const hallIndex = updatedHalls.findIndex(h => h.code === hallCode);
      if (hallIndex === -1) return;

      // Check if brand exists in our map (handling multiple rows for same brand)
      let brand = brandMap.get(brandId);

      if (!brand) {
        brand = {
          id: brandId,
          booth: booth,
          name: brandName,
          description: description || '',
          models: [],
          fullModelList: []
        };
        brandMap.set(brandId, brand);
        updatedHalls[hallIndex].brands.push(brand);
      }

      // Add Model if present
      if (modelName) {
        const isKey = isKeyStr?.toUpperCase() === 'TRUE';
        
        if (isKey) {
          brand.models.push({
            name: modelName,
            highlight: tag || '',
            isNewLaunch: true
          });
        } else {
          if (!brand.fullModelList) brand.fullModelList = [];
          brand.fullModelList.push(modelName);
        }
      }
    });

    return updatedHalls;

  } catch (error) {
    console.error("Failed to load CSV data:", error);
    return skeletonHalls; // Return skeleton if fail
  }
};