package org.as3wavsound.sazameki.format.riff {
	import flash.utils.ByteArray;
	
	/**
	 * ...
	 *
	 * @author Takaaki Yamazaki(zk design),
	 * @author Benny Bottema (modified, optimized and cleaned up code)
	 */
	public class LIST extends Chunk {
		protected var _type:String;
		protected var _chunks:Vector.<Chunk>;
		
		public function LIST(type:String) {
			this.type = type;
			super("LIST");
		}
		
		public function set type(value:String):void {
			if (value.length > 4) {
				value = value.substr(0, 4);
			} else if (value.length < 4) {
				while (value.length < 4) {
					value += " ";
				}
			}
			_type = value;
		}
		
		public function get type():String { 
			return _type; 
		}

		override protected function encodeData():ByteArray {
			var result:ByteArray = new ByteArray();
			result.writeUTFBytes(_type);
			for (var i:int = 0; i < _chunks.length; i++) {
				result.writeBytes(_chunks[i].toByteArray());
			}
			return result;
		}
		
		protected function splitList(bytes:ByteArray):Object {
			var obj:Object = new Object();
			bytes.position = 0;
			bytes.endian = ENDIAN;

			if (bytes.readUTFBytes(4) == 'RIFF') {
				bytes.readInt();
				bytes.readUTFBytes(4);//type
			} else {
				bytes.position = 0;
			}

			while (bytes.position < bytes.length) {
				var currentName:String = bytes.readUTFBytes(4);
				var current:int = bytes.readInt();

				if (currentName == 'LIST') {
					currentName = bytes.readUTFBytes(4);
					current -= 4;
				}

				var tmpByte:ByteArray = new ByteArray();
				bytes.readBytes(tmpByte, 0, current);

				if (current % 2 == 1) {
					bytes.readByte();
				}
				obj[currentName] = tmpByte;
			}
			return obj;
		}
	}
}