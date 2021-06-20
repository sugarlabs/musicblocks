package org.as3wavsound.sazameki.format.wav.chunk {
	import flash.utils.ByteArray;
	import org.as3wavsound.sazameki.core.AudioSetting;
	import org.as3wavsound.sazameki.format.riff.Chunk;
	
	/**
	 * ...
	 * 
	 * @author Takaaki Yamazaki(zk design), 
	 * @author Benny Bottema (modified, optimized and cleaned up code)
	 */
	public class WavfmtChunk extends Chunk {
		private var _setting:AudioSetting;
		
		public function WavfmtChunk() {
			super('fmt ');
		}
		
		public function setSetting(setting:AudioSetting):void {
			_setting = setting;
		}
		
		override protected function encodeData():ByteArray {
			var result:ByteArray = new ByteArray();
			result.endian = ENDIAN;
			
			//fmt ID(2)
			result.writeShort(1);
			//channels(2)
			result.writeShort(_setting.channels);
			//sampling rate(4)
			result.writeInt(_setting.sampleRate);
			//data rate(4)
			result.writeInt(_setting.sampleRate * _setting.channels * (_setting.bitRate / 8));
			//block size(2)
			result.writeShort((_setting.bitRate / 8) * _setting.channels);
			//bit rate(2)
			result.writeShort(_setting.bitRate);
			
			return result;
		}
		
		public function decodeData(bytes:ByteArray):AudioSetting {
			bytes.position = 0;
			bytes.endian = ENDIAN;
			bytes.readShort();
			var channels:int = bytes.readShort();
			var smplRate:int = bytes.readInt();
			bytes.readInt();
			bytes.readShort();
			var bit:int = bytes.readShort();
			_setting = new AudioSetting(channels, smplRate, bit);
			return _setting;
		}
	}
}