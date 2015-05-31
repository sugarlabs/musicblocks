package org.as3wavsound.sazameki.format.wav.chunk  {
	import flash.utils.ByteArray;
	import org.as3wavsound.sazameki.core.AudioSamples;
	import org.as3wavsound.sazameki.core.AudioSetting;
	import org.as3wavsound.sazameki.format.riff.Chunk;
	
	/**
	 * ...
	 * 
	 * @author Takaaki Yamazaki(zk design), 
	 * @author Benny Bottema (modified, optimized and cleaned up code)
	 */
	public class WavdataChunk extends Chunk {
		private var _samples:AudioSamples;
		
		public function WavdataChunk() {
			super('data');
		}
		
		public function setAudioData(samples:AudioSamples):void {
			_samples = samples;
		}
		
		override protected function encodeData():ByteArray {
			var bytes:ByteArray = new ByteArray();
			bytes.endian = ENDIAN;

			var setting:AudioSetting = _samples.setting;
			var i:int;
			var sig:Number;
			var len:int = _samples.left.length;
			var left:Vector.<Number>;
			
			if (setting.channels == 2) {
				left=_samples.left;
				var right:Vector.<Number>=_samples.right;
				
				if (setting.bitRate == 16) {
					for (i = 0; i < len; i++) {
						sig = left[i];
						if (sig < -1) bytes.writeShort( -32767);
						else if (sig > 1) bytes.writeShort( 32767);
						else bytes.writeShort(sig * 32767);
						
						sig = right[i];
						if (sig < -1) bytes.writeShort(-32767);
						else if (sig > 1) bytes.writeShort(32767);
						else bytes.writeShort(sig * 32767);
					}
				} else {
					for (i = 0; i < len; i++) {
						sig = left[i];
						if (sig<-1) bytes.writeByte(0);
						else if (sig>1) bytes.writeByte(255);
						else bytes.writeByte(sig*127+128);
						
						sig = right[i];
						if (sig<-1) bytes.writeByte(0);
						else if (sig>1) bytes.writeByte(255);
						else bytes.writeByte(sig*127+128);
					}
				}
			} else {
				left = _samples.left;

				if (setting.bitRate == 16) {
					for (i = 0; i < len; i++) {
						sig = left[i];
						if (sig < -1) bytes.writeShort(-32767);
						else if (sig > 1) bytes.writeShort(32767);
						else bytes.writeShort(sig * 32768);
					}
				} else {
					for (i = 0; i < len; i++) {
						sig = left[i];
						if (sig<-1) bytes.writeByte(0);
						else if (sig>1) bytes.writeByte(255);
						else bytes.writeByte(sig*127+128);
					}
				}
				
			}
			return bytes;
		}
		
		public function decodeData(bytes:ByteArray, setting:AudioSetting):AudioSamples {
			bytes.position = 0;
			bytes.endian = ENDIAN;
			
			var samples:AudioSamples = new AudioSamples(setting);
			var length:int = bytes.length / (setting.bitRate / 8) / setting.channels;
			var i:int;
			var left:Vector.<Number>;
			
			if (setting.channels == 2) {
				left = samples.left;
				var right:Vector.<Number> = samples.right;
				if (setting.bitRate == 16) {
					for (i = 0; i < length; ++i) {
						left[i] = bytes.readShort() / 32767;
						right[i] = bytes.readShort() / 32767;
					}

				} else {
					for (i = 0; i < length; i++)
					{
						left[i] = bytes.readByte() / 255;
						right[i] = bytes.readByte() / 255;
					}
				}
			} else {
				left = samples.left;
				if (setting.bitRate == 16) {
					for (i = 0; i < length; i++) {
						left[i] = bytes.readShort() / 32767;
					}
				} else {
					for (i = 0; i < length; i++) {
						left[i] = bytes.readByte() / 255;
					}
				}
			}
			return samples;
		}
	}
}