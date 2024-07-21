import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import fs from 'fs/promises';
import path from 'path';
import Card from 'App/Models/Card';


export default class CardSeeder extends BaseSeeder {
  public async run () {
    const cardsDirectory = '/Users/macbookpro/Desktop/isra/imagen'

    try {
      const files = await fs.readdir(cardsDirectory);
      const cardPromises = files.map(async (file) => {
        const name = path.basename(file, path.extname(file));
        return Card.create({
          name: name,
          url: `assets/imagen/${file}`  // URL relativa desde la raíz pública
        });
      });

      await Promise.all(cardPromises);
      console.log('Cartas cargadas exitosamente');
    } catch (err) {
      console.error('Error al leer el directorio:', err);
    }
  }
}