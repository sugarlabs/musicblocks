	/* 
	 * --------------------------------------
	 * Benny Bottema -- WavSound Sound adaption
	 * http://blog.projectnibble.org/
	 * --------------------------------------
	 * sazameki -- audio manipulating library
	 * http://sazameki.org/
	 * --------------------------------------
	 * 
	 * - developed by:
	 * 						Benny Bottema
	 * 						blog.projectnibble.org
	 *   hosted by: 
	 *  					Google Code (code.google.com)
	 * 						code.google.com/p/as3wavsound/
	 * 
	 * - audio library in its original state developed by:
	 * 						Takaaki Yamazaki
	 * 						www.zkdesign.jp
	 *   hosted by: 
	 *  					Spark project (www.libspark.org)
	 * 						www.libspark.org/svn/as3/sazameki/branches/fp10/
	 */
	
	/*
	 * Licensed under the MIT License
	 * 
	 * Copyright (c) 2008 Takaaki Yamazaki
	 * 
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 * 
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 * 
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	 * THE SOFTWARE.
	 */
package org.as3wavsound {
	import flash.events.SampleDataEvent;
	import flash.media.Sound;
	import flash.media.SoundChannel;
	import flash.media.SoundTransform;
	import flash.net.URLRequest;
	import flash.utils.ByteArray;
	import org.as3wavsound.sazameki.core.AudioSamples;
	import org.as3wavsound.sazameki.core.AudioSetting;
	import org.as3wavsound.WavSoundChannel;
	
	/**
	 * This player is used by WavSound instances to relay play() calls to and 
	 * return the resulting WavSoundChannel instances.
	 * 	 
	 * This player is used by WavSoundChannel instances to relay stop() calls to.
	 * 
	 * This player contains a single Sound object which acts as the master buffer in which 
	 * all playing sounds are mixed to. This is done to reduce cpu / memory footprint. The
	 * player will loop through all playing WavSoundChannel instances and call 
	 * buffer(masterSampleBuffer) function on each, before writing the end result to the 
	 * sound card's outputstream.
	 * 
	 * @author Benny Bottema
	 */
	internal class WavSoundPlayer {
		// The size of the master sample buffer used for playback.
		// Too small: the sound will have a jittery playback.
		// Too big: the sound will have high latencies (loading, stopping, playing, etc.). 
		public static var MAX_BUFFERSIZE:Number = 8192;

		// the master samples buffer in which all seperate Wavsounds are mixed into, always stereo at 44100Hz and bitrate 16
		private const sampleBuffer:AudioSamples = new AudioSamples(new AudioSetting(), MAX_BUFFERSIZE);
		// a list of all WavSound currenctly in playing mode
		private const playingWavSounds:Vector.<WavSoundChannel> = new Vector.<WavSoundChannel>();
		
		// the singular playback Sound with which all other WavSounds are played back
		private const player:Sound = configurePlayer();
		
		/**
		 * Static initializer: creates, configures and a sound player using the 'sample 
		 * data event technique'. Until play() has been called on a WavSound, nothing is 
		 * audible, because playingWavSounds will still be empty.
		 * 
		 * Also see: http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/events/SampleDataEvent.html
		 */
		private function configurePlayer():Sound {
			var player:Sound = new Sound();
			player.addEventListener(SampleDataEvent.SAMPLE_DATA, onSamplesCallback);
			player.play();
			return player;
		}
		
		/**
		 * Creates WavSoundChannel and adds it to the list of currently playing channels 
		 * (which are mixed into the master sample buffer).
		 * 
		 * This function is called by WavSound instances which returns the new WavSoundChannel 
		 * instance to the user. 
		 */
		internal function play(sound:WavSound, startTime:Number, loops:int, sndTransform:SoundTransform):WavSoundChannel {
			var channel:WavSoundChannel = new WavSoundChannel(this, sound, startTime, loops, sndTransform);
			playingWavSounds.push(channel);
			return channel;
		}
		
		/**
		 * Remove a specific currently playing channel, so that its samples won't be 
		 * mixed to the master sample buffer anymore and therefor playback will stop.
		 */
		internal function stop(channel:WavSoundChannel):void {
			for each (var playingWavSound:WavSoundChannel in playingWavSounds) {
				if (playingWavSound == channel) {
					playingWavSounds.splice(playingWavSounds.lastIndexOf(playingWavSound), 1);
				}
			}
		}
		
		/**
		 * The heartbeat of the WavSound approach, invoked by the master Sound object.
		 * 
		 * This function handles the SampleDataEvent to mix all playing sounds in playingWavSounds 
		 * into the Sound's buffer. For each playing WavSoundChannel instance, the player will call 
		 * the channel's buffer() function to have it mix itself into the master sample buffer.
		 * Finally, the resulting master buffer is written to the event's output stream.
		 * 
		 * Also see: http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/events/SampleDataEvent.html
		 * 
		 * @param event Contains the soundcard outputstream to mix sound samples into.
		 */
		private function onSamplesCallback(event:SampleDataEvent):void {
			// clear the buffer
			sampleBuffer.clearSamples();
			// have all channels mix their into the master sample buffer
			for each (var playingWavSound:WavSoundChannel in playingWavSounds) {
				playingWavSound.buffer(sampleBuffer);
			}
			
			// extra references to avoid excessive getter calls in the following 
			// for-loop (it appeares CPU is being hogged otherwise)
			var outputStream:ByteArray = event.data;
			var samplesLength:Number = sampleBuffer.length;
			var samplesLeft:Vector.<Number> = sampleBuffer.left;
			var samplesRight:Vector.<Number> = sampleBuffer.right;
			
			// write all mixed samples to the sound's outputstream
			for (var i:int = 0; i < samplesLength; i++) {
				outputStream.writeFloat(samplesLeft[i]);
				outputStream.writeFloat(samplesRight[i]);
			}
		}
	}
}