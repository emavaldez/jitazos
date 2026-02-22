import { motion, Reorder } from "framer-motion";
import { useState } from "react";

export const Timeline = ({ teamSongs }: { teamSongs: Song[] }) => {
  const [items, setItems] = useState(teamSongs);

  return (
    <div className="grid grid-cols-5 gap-4 p-4 bg-gray-900 rounded-xl">
      {/* Usamos Reorder de framer-motion para el desplazamiento automático */}
      <Reorder.Group axis="x" values={items} onReorder={setItems} className="flex flex-wrap gap-2">
        {items.map((song) => (
          <Reorder.Item key={song.id} value={song}>
            <div className="w-24 h-32 bg-green-600 rounded-md flex flex-col justify-end p-2 text-[10px] font-bold">
              {song.year}
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
};