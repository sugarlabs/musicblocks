package org.as3wavsound.sazameki.format.riff {
	import flash.utils.ByteArray;
	import flash.utils.Endian;
	
	/**
	 * RIFF Chunk class
	 * 	 
	 * @author Takaaki Yamazaki(zk design), 
	 * @author Benny Bottema (modified, optimized and cleaned up code)
	 */
	public class Chunk {
		protected const ENDIAN:String = Endian.LITTLE_ENDIAN;
		protected var _id:String;
		
		public function Chunk(id:String)  {
			this.id = id;
		}
		
		public function set id(value:String):void {
			if (value.length > 4) {
				value = value.substr(0, 4);
			} else if (value.length < 4) {
				while (value.length < 4) {
					value += " ";
				}
			}
			_id = value;
		}
		
		public function get id():String { 
			return _id;
		}
		
		public function toByteArray():ByteArray {
			var result:ByteArray = new ByteArray();
			result.endian = ENDIAN;
			result.writeUTFBytes(_id);
			var data:ByteArray = encodeData();
			result.writeUnsignedInt(data.length);
			result.writeBytes(data);	
			return result;
		}
		
		protected function encodeData():ByteArray {
			throw new Error("'encodeData()' method must be overriden");
		}
	}
}