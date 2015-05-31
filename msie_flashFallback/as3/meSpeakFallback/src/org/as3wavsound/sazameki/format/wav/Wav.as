package org.as3wavsound.sazameki.format.wav {
	import org.as3wavsound.sazameki.core.AudioSamples;
	import org.as3wavsound.sazameki.core.AudioSetting;
	import org.as3wavsound.sazameki.format.riff.Chunk;
	import org.as3wavsound.sazameki.format.riff.RIFF;
	import org.as3wavsound.sazameki.format.wav.chunk.WavdataChunk;
	import org.as3wavsound.sazameki.format.wav.chunk.WavfmtChunk;
	
	import flash.utils.ByteArray;
	
	/**
	 * The WAVE decoder used for playing back wav files.
	 *
	 * @author Takaaki Yamazaki(zk design),
	 * @author Benny Bottema (modified, optimized and cleaned up code)
	 */
	public class Wav extends RIFF {

		public function Wav() {
			super('WAVE');
		}
		
		public function encode(samples:AudioSamples):ByteArray {
			var fmt:WavfmtChunk = new WavfmtChunk();
			var data:WavdataChunk = new WavdataChunk();

			_chunks = new Vector.<Chunk>;
			_chunks.push(fmt);
			_chunks.push(data);

			data.setAudioData(samples);
			fmt.setSetting(samples.setting);
			
			return toByteArray();
		}
		
		public function decode(wavData:ByteArray, setting:AudioSetting):AudioSamples {
			var obj:Object = splitList(wavData);
			var data:AudioSamples;
			
			var relevantSetting:AudioSetting = setting;
			if (relevantSetting == null && obj['fmt ']) {
				relevantSetting = new WavfmtChunk().decodeData(obj['fmt '] as ByteArray);
			}
			
			if (obj['fmt '] && obj['data']) {
				data = new WavdataChunk().decodeData(obj['data'] as ByteArray, relevantSetting);
			} else {
				data = new WavdataChunk().decodeData(wavData, relevantSetting);
			}
			
			var needsResampling:Boolean = relevantSetting != null && relevantSetting.sampleRate != 44100;
			return (needsResampling) ? resampleAudioSamples(data, relevantSetting.sampleRate) : data;
		}
		
		/**
		 * Resamples the given audio samples from a given sample rate to a target sample rate (or default 44100).
		 * 
		 * @author Simion Medvedi (medvedisimion@gmail.com)
		 * @author Benny Bottema (sanitized code and added support for stereo resampling)
		 */
		private function resampleAudioSamples(data:AudioSamples, sourceRate:int, targetRate:int = 44100):AudioSamples {
			var newSize:int = data.length * targetRate / sourceRate;
			var newData:AudioSamples = new AudioSamples(new AudioSetting(data.setting.channels, targetRate, 16), newSize);
			
			resampleSamples(data.left, newData.left, newSize, sourceRate, targetRate);
			// playback buffering in WavSoundChannel will take care of a possibly missing right channel
			if (data.setting.channels == 2) {
				resampleSamples(data.right, newData.right, newSize, sourceRate, targetRate);
			}
			
			return newData;
		}
		
		/**
		 * Resamples the given audio samples from a given sample rate to a target sample rate (or default 44100).
		 * 
		 * @author Simion Medvedi (medvedisimion@gmail.com)
		 * @author Benny Bottema (sanitized code)
		 */
		private function resampleSamples(sourceSamples:Vector.<Number>, targetSamples:Vector.<Number>, newSize:int, sourceRate:int, targetRate:int = 44100):void {
			// we need to expand the sample rate from whatever it is to targetRate Khz.  This code
			// is assuming that the sample rate will be < targetRate Khz.
			var multiplier:Number = targetRate / sourceRate;
			
			// convert the data
			var measure:int = targetRate;
			var sourceIndex:int = 0;
			var targetIndex:int = 0;
	
			while (targetIndex < newSize) {
				if (measure >= sourceRate) {
					var increment:Number = 0;
					if (targetIndex > 0 && sourceIndex < sourceSamples.length - 1) {
						increment = (sourceSamples[sourceIndex + 1] - sourceSamples[sourceIndex]) / multiplier;
					}
					targetSamples[targetIndex++] = sourceSamples[sourceIndex] + increment;
					measure -= sourceRate;
				} else {
					sourceIndex++;
					measure += targetRate;
				}
			}
		}
	}
}